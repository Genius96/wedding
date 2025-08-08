import { progress } from "./progress.js";
import { util } from "../../common/util.js";

export const audio = (() => {
  const statePlay = '<i class="fa-solid fa-circle-pause spin-button"></i>';
  const statePause = '<i class="fa-solid fa-circle-play"></i>';

  /**
   * Tải bài hát với timeout
   * @param {string} url
   * @returns {Promise<HTMLAudioElement|null>}
   */
  const loadTrack = (url) =>
    new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn(`Timeout loading audio: ${url}`);
        resolve(null); // Bỏ qua bài hát nếu timeout
      }, 10000); // Timeout sau 5 giây

      const audioElement = new Audio(url);
      audioElement.loop = false;
      audioElement.muted = false;
      audioElement.autoplay = false;
      audioElement.controls = false;

      audioElement.addEventListener(
        "loadedmetadata",
        () => {
          clearTimeout(timeout);
          resolve(audioElement);
        },
        { once: true }
      );

      audioElement.addEventListener(
        "error",
        () => {
          console.error("Error loading audio:", url);
          clearTimeout(timeout);
          resolve(null); // Bỏ qua bài hát nếu lỗi
        },
        { once: true }
      );
    });

  /**
   * Tải danh sách bài hát
   * @param {boolean} [playOnOpen=true]
   * @returns {Promise<void>}
   */
  const load = async (playOnOpen = true) => {
    const audioUrls = document.body
      .getAttribute("data-audios")
      ?.split(",")
      .map((url) => url.trim());
    if (!audioUrls || audioUrls.length === 0) {
      console.log("No audio URLs provided, skipping audio");
      progress.complete("audio", true);
      return;
    }

    const music = document.getElementById("button-music");
    let audioEl = null;
    let currentTrackIndex = Math.floor(Math.random() * audioUrls.length);
    let isPlay = false;
    let attempts = 0;

    /**
     * Phát bài hát
     */
    const play = async () => {
      if (!navigator.onLine || !music || !audioEl) {
        return;
      }
      music.disabled = true;
      try {
        await audioEl.play();
        isPlay = true;
        music.disabled = false;
        music.innerHTML = statePlay;
      } catch (err) {
        isPlay = false;
        console.error("Error playing audio:", err);
        util.notify("Không thể phát nhạc, vui lòng thử lại.").error();
      }
    };

    /**
     * Tạm dừng bài hát
     */
    const pause = () => {
      if (audioEl) {
        isPlay = false;
        audioEl.pause();
        music.innerHTML = statePause;
      }
    };

    // Thử tải bài hát cho đến khi thành công hoặc hết danh sách
    while (attempts < audioUrls.length && !audioEl) {
      audioEl = await loadTrack(audioUrls[currentTrackIndex]);
      attempts += 1;
      if (!audioEl) {
        console.warn(`Skipping audio at index ${currentTrackIndex}`);
        currentTrackIndex = (currentTrackIndex + 1) % audioUrls.length; // Thử bài tiếp theo
      }
    }

    if (!audioEl) {
      console.warn("All audio tracks failed to load, skipping audio");
      progress.complete("audio", true);
      return;
    }

    // Gọi progress.complete khi tải thành công một bài hát
    progress.complete("audio");

    // Xử lý khi bài hát kết thúc
    audioEl.addEventListener("ended", async () => {
      currentTrackIndex = Math.floor(Math.random() * audioUrls.length);
      let newAudio = null;
      let newAttempts = 0;

      // Thử tải bài mới cho đến khi thành công hoặc hết danh sách
      while (newAttempts < audioUrls.length && !newAudio) {
        newAudio = await loadTrack(audioUrls[currentTrackIndex]);
        newAttempts += 1;
        if (!newAudio) {
          currentTrackIndex = (currentTrackIndex + 1) % audioUrls.length;
        }
      }

      if (newAudio) {
        audioEl = newAudio;
        if (isPlay) {
          play();
        }
      } else {
        console.warn("No more audio tracks available");
      }
    });

    // Sự kiện khi mở undangan
    document.addEventListener("undangan.open", () => {
      if (music) {
        music.classList.remove("d-none");
        if (playOnOpen) {
          play();
        }
      }
    });

    // Tạm dừng khi offline
    window.addEventListener("offline", pause);

    // Xử lý click để phát/tạm dừng
    if (music) {
      music.addEventListener("click", () => (isPlay ? pause() : play()));
    }
  };

  /**
   * Khởi tạo
   * @returns {object}
   */
  const init = () => {
    progress.add();
    return { load };
  };

  return { init };
})();
