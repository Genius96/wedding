import { progress } from "./progress.js";
import { util } from "../../common/util.js";
import { cache } from "../../connection/cache.js";

export const audio = (() => {
  const statePlay = '<i class="fa-solid fa-circle-pause spin-button"></i>';
  const statePause = '<i class="fa-solid fa-circle-play"></i>';

  /**
   * @param {boolean} [playOnOpen=true]
   * @returns {Promise<void>}
   */
  const load = async (playOnOpen = true) => {
    // Lấy danh sách bài hát từ data-audios
    const audioUrls = document.body
      .getAttribute("data-audios")
      ?.split(",")
      .map((url) => url.trim());
    if (!audioUrls || audioUrls.length === 0) {
      progress.complete("audio", true);
      return;
    }

    /**
     * @type {HTMLAudioElement|null}
     */
    let audioEl = null;
    let currentTrackIndex = Math.floor(Math.random() * audioUrls.length); // Chọn bài ngẫu nhiên ban đầu
    let isPlay = false; // Khai báo isPlay ở đây để tất cả hàm con có thể truy cập

    /**
     * Phát bài hát
     * @returns {Promise<void>}
     */

    const music = document.getElementById("button-music");
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
        util.notify(err).error();
      }
    };

    /**
     * Tải bài hát từ URL
     * @param {string} url
     * @returns {Promise<void>}
     */
    const loadTrack = async (url) => {
      try {
        audioEl = new Audio(
          await cache("audio").withForceCache().get(url, progress.getAbort())
        );
        audioEl.loop = false; // Tắt loop để chuyển bài khi kết thúc
        audioEl.muted = false;
        audioEl.autoplay = false;
        audioEl.controls = false;

        // Sự kiện khi bài hát kết thúc
        audioEl.addEventListener("ended", () => {
          // Chọn bài ngẫu nhiên khác
          currentTrackIndex = Math.floor(Math.random() * audioUrls.length);
          loadTrack(audioUrls[currentTrackIndex]).then(() => {
            if (isPlay) {
              // Thêm {} để tuân thủ ESLint
              play();
            }
          });
        });

        progress.complete("audio");
      } catch {
        progress.invalid("audio");
        return;
      }
    };

    // Tải bài hát đầu tiên
    await loadTrack(audioUrls[currentTrackIndex]);

    /**
     * Tạm dừng bài hát
     * @returns {void}
     */
    const pause = () => {
      if (audioEl) {
        isPlay = false;
        audioEl.pause();
        music.innerHTML = statePause;
      }
    };

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

    // Xử lý sự kiện click để phát/tạm dừng
    if (music) {
      music.addEventListener("click", () => (isPlay ? pause() : play()));
    }
  };

  /**
   * @returns {object}
   */
  const init = () => {
    progress.add();

    return {
      load,
    };
  };

  return {
    init,
  };
})();
