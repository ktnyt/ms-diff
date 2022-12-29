import clsx from "clsx";
import {
  Component,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";

const crop = (
  imageData: ImageData,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
): ImageData => {
  const out = new ImageData(sw, sh);
  let i = 0;
  for (let y = sy; y < sy + sh; y++) {
    for (let x = sx; x < sx + sw; x++) {
      for (let p = 0; p < 4; p++) {
        out.data[i] = imageData.data[4 * (y * imageData.width + x) + p];
        i++;
      }
    }
  }
  return out;
};

const App: Component = () => {
  const [dragging, setDragging] = createSignal(false);

  let srcCanvas: HTMLCanvasElement;
  let dstCanvas: HTMLCanvasElement;

  const [getImageData, setImageData] = createSignal<ImageData>();

  const img = new Image();
  img.onload = () => {
    const ctx = srcCanvas.getContext("2d");
    srcCanvas.width = img.width;
    srcCanvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    setImageData(ctx.getImageData(0, 0, img.width, img.height));
  };

  const [frame, setFrame] = createSignal(false);

  const handle = setInterval(() => setFrame((prev) => !prev), 200);
  onCleanup(() => clearInterval(handle));

  createEffect(() => {
    const ctx = dstCanvas.getContext("2d");
    const imageData = getImageData();
    if (!imageData) return;
    const left = crop(imageData, 150, 50, 600, 600);
    const right = crop(imageData, 608, 50, 600, 600);
    const out = frame() ? left : right;
    dstCanvas.width = out.width;
    dstCanvas.height = out.height;
    ctx.putImageData(out, 0, 0);
  });

  return (
    <>
      <canvas ref={srcCanvas} class="hidden" />
      <div class="flex w-full h-full justify-center items-center">
        <div>
          <canvas ref={dstCanvas} />
        </div>
      </div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragEnd={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.items
            ? event.dataTransfer.items[0].getAsFile()
            : event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            img.src = URL.createObjectURL(file);
          }
          setDragging(false);
        }}
        class={clsx(
          "fixed top-0 left-0 bottom-0 right-0",
          dragging() || !getImageData()
            ? "bg-slate-300 bg-opacity-80 opacity-100"
            : "opacity-0",
        )}
      >
        <div class="flex justify-center items-center w-full h-full">
          <div>
            <h1 class="text-4xl text-slate-600">
              ここに画像をドラッグ&ドロップ
            </h1>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
