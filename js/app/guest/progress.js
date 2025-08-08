export const progress = (() => {
  let info = null;
  let bar = null;
  let total = 0;
  let loaded = 0;
  let valid = true;
  let isDone = false;
  let cancelProgress = null;

  const add = () => {
    total += 1;
  };

  const showInformation = () => {
    return `(${loaded}/${total}) [${parseInt((loaded / total) * 100).toFixed(
      0
    )}%]`;
  };

  const complete = (type, skip = false) => {
    if (!valid) {
      return;
    }
    loaded += 1;

    info.innerText = `Loading ${type} ${
      skip ? "skipped" : "complete"
    } ${showInformation()}`;
    bar.style.width = Math.min((loaded / total) * 100, 100).toString() + "%";

    if (loaded === total) {
      isDone = true;
      document.dispatchEvent(new Event("undangan.progress.done"));
    }
  };

  const invalid = (type) => {
    if (valid && !isDone) {
      valid = false;
      console.error(
        `Progress invalid: ${type}, loaded=${loaded}, total=${total}`
      );
      bar.style.backgroundColor = "red";
      info.innerText = `Error loading ${type} ${showInformation()}`;
      document.dispatchEvent(new Event("undangan.progress.invalid"));
    }
  };

  const getAbort = () => cancelProgress;

  const init = () => {
    info = document.getElementById("progress-info");
    bar = document.getElementById("progress-bar");
    info.classList.remove("d-none");
    cancelProgress = new Promise((res) =>
      document.addEventListener("undangan.progress.invalid", res)
    );
    // Timeout sau 10 giây nếu tiến trình chưa hoàn tất
    setTimeout(() => {
      if (!isDone) {
        console.warn("Progress timeout");
        invalid("timeout");
      }
    }, 50000);
  };

  return {
    init,
    add,
    invalid,
    complete,
    getAbort,
  };
})();
