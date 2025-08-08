import { progress } from "./progress.js";

export const video = (() => {
  /**
   * Tải video
   * @returns {Promise<void>}
   */
  const load = () => {
    const wrap = document.getElementById("video-love-story");
    if (!wrap || !wrap.hasAttribute("data-src")) {
      wrap?.remove();
      progress.complete("video", true);
      return Promise.resolve();
    }

    const src = wrap.getAttribute("data-src");
    if (!src) {
      progress.complete("video", true);
      return Promise.resolve();
    }

    const vid = document.createElement("video");
    vid.className = wrap.getAttribute("data-vid-class");
    vid.loop = true;
    vid.muted = true;
    vid.controls = true;
    vid.autoplay = false;
    vid.playsInline = true;
    vid.preload = "metadata";
    vid.disableRemotePlayback = true;
    vid.disablePictureInPicture = true;
    vid.controlsList = "noremoteplayback nodownload noplaybackrate";
    // Sử dụng transform để dịch chuyển video, đảm bảo hiển thị phần giữa
    vid.style.cssText =
      "position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transform: translateY(-40%) scale(1); transform-origin: center; border-radius: 0.5rem;";

    const observer = new IntersectionObserver((es) =>
      es.forEach((e) => (e.isIntersecting ? vid.play() : vid.pause()))
    );

    vid.src = src;
    wrap.appendChild(vid);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error("Timeout loading video:", src);
        progress.invalid("video");
        reject(new Error(`Timeout loading video: ${src}`));
      }, 30000); // Timeout sau 30 giây

      vid.addEventListener(
        "loadedmetadata",
        () => {
          console.log("Video metadata loaded:", src);
          clearTimeout(timeout);
          vid.style.removeProperty("height");
          document.getElementById("video-love-story-loading")?.remove();
          progress.complete("video");
          observer.observe(vid);
          resolve();
        },
        { once: true }
      );

      vid.addEventListener(
        "error",
        () => {
          console.error("Error loading video:", src);
          clearTimeout(timeout);
          progress.invalid("video");
          reject(new Error(`Failed to load video: ${src}`));
        },
        { once: true }
      );
    });
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
