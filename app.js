const PROGRAMS = {
  program1: `
原地 拉
1
右 问
原地 拉
下 2
原地 拉
上 2
左 1
原地 拉
2
上 问
原地 拉
左 x
原地 拉
循环：
    右 1
    侦测
    原地 拉
下 y
循环：
    左 1
    侦测
    原地 拉
循环：
    循环：
        右 1
        侦测
    下 2
    侦测
    上 2
    原地 捡
    下 1
    原地 拉
    循环：
        上 1
        侦测
    原地 捡
    左 x
    右 y
    下 y
    下 x
    左 x
    原地拉
    循环：
        上 1
        侦测
        下 1
        原地 捡
        上 1
        原地 拉
        循环：
            上 1
            侦测
        循环：
            上 1
            侦测
        原地 捡
        上 1
        原地 拉
        循环：
            下 1
            侦测
        循环：
            下 1
            侦测
    下 1
    原地 捡
    上 1
    循环：
        上 1
        侦测
    原地 捡
    上 1
    原地 拉
    循环：
        下 1
        侦测
原地 捡
上 2
原地 捡
循环：
    左 1
    下 1
    原地 捡
    上 1
    侦测
循环：
    上 1
    侦测
说 乘法
说 y`,
  program2: `启用 拓展
横着 拉
说 y`
};

const codeInput = document.querySelector("#codeInput");
const lineNumbers = document.querySelector("#lineNumbers");
const currentLine = document.querySelector("#currentLine");
const exampleSelect = document.querySelector("#exampleSelect");
const runButton = document.querySelector("#runButton");
const stepButton = document.querySelector("#stepButton");
const resetButton = document.querySelector("#resetButton");
const clearButton = document.querySelector("#clearButton");
const speedInput = document.querySelector("#speedInput");
const speedValue = document.querySelector("#speedValue");
const boardCanvas = document.querySelector("#boardCanvas");
const ctx = boardCanvas.getContext("2d");
const consoleOutput = document.querySelector("#consoleOutput");
const clearConsoleButton = document.querySelector("#clearConsoleButton");
const inputForm = document.querySelector("#inputForm");
const consoleInput = document.querySelector("#consoleInput");
const inputHint = document.querySelector("#inputHint");
const extensionPill = document.querySelector("#extensionPill");
const artPill = document.querySelector("#artPill");
const statusDot = document.querySelector("#statusDot");
const statusText = document.querySelector("#statusText");

// This state mirrors ms.py: n, position, dutyList*, cycList and specialList.
const state = {
  x: 0,
  y: 0,
  n: 0,
  steps: 0,
  running: false,
  asking: false,
  inputedText: "",
  pendingInput: null,
  end: false,
  timer: null,
  codes: [],
  dutyList: [],
  dutyListX: [],
  dutyListY: [],
  cycList: [],
  specialList: [],
  libList: [],
  art: false,
  output: []
};

function getLines() {
  return codeInput.value.replace(/\r/g, "").split("\n");
}

function countingSpace(raw) {
  // Equivalent to ms.py's lstrip('   ') and split(' ').
  const body = raw.replace(/^ +/, "");
  const tokens = body.split(" ");
  if (body.length >= 2) {
    while (tokens[tokens.length - 1] === "") tokens.pop();
  }
  return {
    indent: (raw.length - body.length) / 4,
    tokens
  };
}

function parseProgram() {
  state.codes = getLines().map((raw, line) => {
    const parsed = countingSpace(raw);
    return { raw, line: line + 1, indent: parsed.indent, tokens: parsed.tokens };
  });
  updateEditorMeta();
}

function isDigits(value) {
  return /^\d+$/.test(value);
}

function samePosition(a, b) {
  return Array.isArray(a) && a[0] === b[0] && a[1] === b[1];
}

function positionIn(list, position) {
  return list.some((item) => samePosition(item, position));
}

function removePosition(list, position) {
  const index = list.findIndex((item) => samePosition(item, position));
  if (index !== -1) list.splice(index, 1);
}

function currentPosition() {
  return [state.x, state.y];
}

function getDirty(position = currentPosition()) {
  return (positionIn(state.dutyList, position) ||
    state.dutyListY.includes(position[0]) ||
    state.dutyListX.includes(position[1])) &&
    !positionIn(state.specialList, position);
}

function move(direction, distance) {
  if (direction === "左") state.x -= distance;
  if (direction === "右") state.x += distance;
  if (direction === "下") state.y -= distance;
  if (direction === "上") state.y += distance;
}

function setStatus(label, type = "") {
  statusText.textContent = label;
  statusDot.className = `status-dot ${type}`.trim();
}

function log(message, type = "") {
  state.output.unshift({ message, type });
  renderConsole();
}

function renderConsole() {
  if (!state.output.length) {
    consoleOutput.innerHTML = '<div class="console-empty">运行结果会显示在这里</div>';
    return;
  }
  consoleOutput.innerHTML = state.output
    .map(({ message, type }) => `<div class="console-line ${type}">${escapeHtml(message)}</div>`)
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function setInputHintVisible(visible) {
  inputHint.hidden = !visible;
  if (visible) {
    inputHint.removeAttribute("hidden");
    inputHint.classList.add("is-active");
  } else {
    inputHint.setAttribute("hidden", "");
    inputHint.classList.remove("is-active");
  }
}

function requestInput() {
  const wasAsking = state.asking;
  state.asking = true;
  consoleInput.disabled = false;
  consoleInput.placeholder = "询问中...";
  setInputHintVisible(true);
  if (!wasAsking) {
    log("程序正在询问：请输入自然数（0 或正整数），然后按回车提交", "prompt");
  }
  setStatus("询问中", "waiting");
  if (state.running) pause();
  consoleInput.focus();
}

function finishInputRequest() {
  state.asking = false;
  state.inputedText = "";
  consoleInput.disabled = true;
  consoleInput.placeholder = "等待程序询问...";
  setInputHintVisible(false);
}

function clearRunIO() {
  state.output = [];
  state.inputedText = "";
  state.pendingInput = null;
  consoleInput.value = "";
  renderConsole();
}

function submitInput(value) {
  if (!state.asking) return;
  if (!isDigits(value)) {
    log("错误：请输入自然数（0 或正整数）", "error");
    consoleInput.value = "";
    setInputHintVisible(true);
    consoleInput.focus();
    return;
  }
  log(`输入：${value}`, "input");
  state.pendingInput = value;
  consoleInput.value = "";
  finishInputRequest();
  render();
  start();
}

function runOriginalExtension(command, get) {
  if (!state.libList.includes("拓展")) return;
  const [head, value] = command.tokens;

  // Port of 库/拓展/拓展.py. The original extension runs after ms.py's
  // built-in command handling and receives the pre-command `get` value.
  if (command.tokens.length === 2 &&
      ["上", "下", "左", "右"].includes(head) &&
      value !== "x" &&
      value !== "y" &&
      !isDigits(value)) {
    const expression = value
      .replaceAll("x", `(${state.x})`)
      .replaceAll("y", `(${state.y})`);
    let k;
    try {
      if (!/^[\d+\-*/().\s]+$/.test(expression)) throw new Error("表达式无效");
      k = Function(`"use strict"; return (${expression})`)();
      if (!Number.isFinite(k)) throw new Error("表达式无效");
    } catch {
      log(`拓展报错：${value} 无法计算`, "error");
      return;
    }
    move(head, k);
    return;
  }

  if (head === "干净侦测" && !get) {
    const loop = state.cycList[state.cycList.length - 1];
    if (loop?.length) {
      state.n = loop[loop.length - 1];
      state.cycList.pop();
    }
  }
}

function runOriginalCommand(command, get) {
  const [head, value] = command.tokens;

  if (head === "启用") {
    if (value === "美术") {
      state.art = true;
    } else if (value === "拓展") {
      if (!state.libList.includes("拓展")) state.libList.push("拓展");
    } else {
      log("报错：库不存在", "error");
    }
  }

  if (head === "循环：") {
    let k = 0;
    const indentation = command.indent;
    for (let index = state.n + 1; index < state.codes.length; index += 1) {
      if (state.codes[index].indent >= indentation + 1) k += 1;
      else break;
    }
    state.cycList.push(Array.from({ length: k }, (_, index) => state.n + 1 + index));
  }

  if (head === "侦测" && get) {
    const loop = state.cycList[state.cycList.length - 1];
    if (loop?.length) {
      state.n = loop[loop.length - 1];
      state.cycList.pop();
    } else {
      log("运行错误：侦测没有对应的循环", "error");
    }
  }

  if (command.tokens.length === 2) {
    if (value === "拉") {
      if (head === "原地") {
        state.dutyList.push(currentPosition());
        if (positionIn(state.specialList, currentPosition())) {
          removePosition(state.specialList, currentPosition());
        }
      }
      if (head === "竖着") {
        state.dutyListY.push(state.x);
        state.specialList = state.specialList.filter((position) => position[0] !== state.x);
      }
      if (head === "横着") {
        state.dutyListX.push(state.y);
        state.specialList = state.specialList.filter((position) => position[1] !== state.y);
      }
    }

    if (value === "捡") {
      if (head === "原地") {
        removePosition(state.dutyList, currentPosition());
        state.specialList.push(currentPosition());
      }
      if (head === "竖着") {
        // Kept in the same command position as ms.py. The original code
        // removes only a matching point and masks intersections with rows.
        if (state.dutyListY.includes(state.x)) {
          removePosition(state.dutyList, currentPosition());
        }
        for (const row of state.dutyListX) {
          state.specialList.push([state.x, row]);
          removePosition(state.dutyList, [state.x, row]);
        }
      }
      if (head === "横着") {
        if (state.dutyListX.includes(state.y)) {
          removePosition(state.dutyList, currentPosition());
        }
        for (const column of state.dutyListY) {
          state.specialList.push([column, state.y]);
          removePosition(state.dutyList, [column, state.y]);
        }
      }
    }
  }

  if (command.tokens.length === 2) {
    let k = 0;
    if (value === "拉" || value === "捡") {
      k = 0;
    } else if (isDigits(value)) {
      k = Number.parseInt(value, 10);
    } else if (value === "x") {
      k = state.x;
    } else if (value === "y") {
      k = state.y;
    } else if (value === "问") {
      if (isDigits(state.pendingInput)) {
        k = Number.parseInt(state.pendingInput, 10);
        state.pendingInput = null;
        finishInputRequest();
      } else {
        requestInput();
      }
    }
    if (["左", "右", "上", "下"].includes(head)) move(head, k);
  }

  if (head === "说") {
    if (command.tokens.length === 2) {
      if (value === "x") log(`输出：${state.x}`, "output");
      else if (value === "y") log(`输出：${state.y}`, "output");
      else if (value === "问") {
        if (isDigits(state.pendingInput)) {
          state.pendingInput = null;
          finishInputRequest();
        } else {
          requestInput();
        }
      }
      else log(`输出：${value}`, "output");
    } else if (command.tokens.length > 2) {
      log("运行错误：说 后只能跟一个值", "error");
    }
  }

  runOriginalExtension(command, get);
}

function step() {
  if (!state.codes.length) return;
  const command = state.end
    ? { raw: "", line: state.codes.length, indent: 0, tokens: [""] }
    : state.codes[state.n];
  const get = getDirty();

  runOriginalCommand(command, get);

  if (!state.asking) {
    const loop = state.cycList[state.cycList.length - 1];
    if (loop?.length && state.n === loop[loop.length - 1]) {
      state.n = loop[0] - 1;
    }
    state.n += 1;
  }
  if (state.n > state.codes.length - 1) state.end = true;
  state.steps += 1;
  render();

  if (state.end) stop("程序结束");
}

function start() {
  if (!state.codes.length) parseProgram();
  if (state.end) reset();
  if (state.steps === 0) clearRunIO();
  state.running = true;
  setStatus(state.asking ? "询问中" : "运行中", state.asking ? "waiting" : "running");
  runButton.innerHTML = '<span class="button-icon">Ⅱ</span>暂停';
  clearInterval(state.timer);
  state.timer = setInterval(step, 1000 / Number(speedInput.value));
}

function pause() {
  state.running = false;
  clearInterval(state.timer);
  state.timer = null;
  if (!state.asking) setStatus("已暂停");
  runButton.innerHTML = '<span class="button-icon">▶</span>运行';
}

function stop(message) {
  pause();
  setStatus(message);
}

function reset() {
  pause();
  state.x = 0;
  state.y = 0;
  state.n = 0;
  state.steps = 0;
  state.asking = false;
  state.inputedText = "";
  state.pendingInput = null;
  state.end = false;
  state.dutyList = [];
  state.dutyListX = [];
  state.dutyListY = [];
  state.cycList = [];
  state.specialList = [];
  state.libList = [];
  state.art = false;
  state.output = [];
  consoleInput.value = "";
  consoleInput.disabled = true;
  consoleInput.placeholder = "等待程序询问...";
  setInputHintVisible(false);
  parseProgram();
  setStatus("准备就绪");
  renderConsole();
  render();
}

function updateEditorMeta() {
  const lines = getLines();
  lineNumbers.textContent = Array.from({ length: lines.length }, (_, i) => i + 1).join("\n");
  document.querySelector("#lineCount").textContent = `${lines.length} 行`;
}

function updateCurrentLine() {
  const command = state.codes[state.n];
  const line = command?.line || state.codes[state.codes.length - 1]?.line || 1;
  currentLine.style.transform = `translateY(${(line - 1) * 21.6}px)`;
}

function drawBoard() {
  const size = boardCanvas.width;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#101216";
  ctx.fillRect(0, 0, size, size);

  const gridCount = 25;
  const cell = size / gridCount;
  const origin = Math.floor(gridCount / 2);
  const start = -12;
  const end = 12;

  ctx.lineWidth = 1;
  for (let index = 0; index <= gridCount; index += 1) {
    const offset = index * cell;
    ctx.strokeStyle = index === origin
      ? "rgba(243, 240, 232, .33)"
      : "rgba(243, 240, 232, .075)";
    ctx.beginPath();
    ctx.moveTo(offset + .5, 0);
    ctx.lineTo(offset + .5, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, offset + .5);
    ctx.lineTo(size, offset + .5);
    ctx.stroke();
  }

  const cellPosition = (x, y) => ({
    px: (x - start) * cell,
    py: (origin - y) * cell
  });

  for (let x = start; x <= end; x += 1) {
    for (let y = start; y <= end; y += 1) {
      if (!getDirty([x, y])) continue;
      const { px, py } = cellPosition(x, y);
      if (state.art) {
        const image = document.querySelector("#dirtyImage");
        if (image?.complete) ctx.drawImage(image, px - cell * .32, py - cell * .32, cell * .64, cell * .64);
      } else {
        ctx.fillStyle = "#9a5a31";
        ctx.beginPath();
        ctx.arc(px, py, cell * .16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(243, 167, 63, .24)";
        ctx.beginPath();
        ctx.arc(px, py, cell * .3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const { px, py } = cellPosition(state.x, state.y);
  if (state.art) {
    const image = document.querySelector("#manImage");
    if (image?.complete) ctx.drawImage(image, px - cell * .42, py - cell * .42, cell * .84, cell * .84);
  } else {
    ctx.fillStyle = "#f3f0e8";
    ctx.beginPath();
    ctx.arc(px, py, cell * .24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f3a73f";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function countDirtyCells() {
  let count = 0;
  for (let x = -12; x <= 12; x += 1) {
    for (let y = -12; y <= 12; y += 1) {
      if (getDirty([x, y])) count += 1;
    }
  }
  return count;
}

function render() {
  document.querySelector("#topX").textContent = state.x;
  document.querySelector("#topY").textContent = state.y;
  document.querySelector("#stepCounter").textContent = `STEP ${state.steps}`;
  extensionPill.textContent = state.libList.includes("拓展") ? "拓展已启用" : "基础指令";
  extensionPill.style.background = state.libList.includes("拓展") ? "var(--accent)" : "var(--mint)";
  artPill.textContent = state.art ? "自定义美术" : "默认美术";
  updateCurrentLine();
  drawBoard();
}

function loadImages() {
  const dirtyImage = new Image();
  dirtyImage.id = "dirtyImage";
  dirtyImage.src = "./库/美术/duty.png";
  const manImage = new Image();
  manImage.id = "manImage";
  manImage.src = "./库/美术/man.jpg";
  document.body.append(dirtyImage, manImage);
  dirtyImage.style.display = "none";
  manImage.style.display = "none";
  dirtyImage.onload = drawBoard;
  manImage.onload = drawBoard;
}

function syncScroll() {
  lineNumbers.scrollTop = codeInput.scrollTop;
  currentLine.style.top = `${14 - codeInput.scrollTop}px`;
}

codeInput.addEventListener("input", () => {
  parseProgram();
  if (!state.running) render();
});
codeInput.addEventListener("scroll", syncScroll);
exampleSelect.addEventListener("change", () => {
  codeInput.value = PROGRAMS[exampleSelect.value];
  reset();
});
runButton.addEventListener("click", () => state.running ? pause() : start());
stepButton.addEventListener("click", () => {
  if (state.running) pause();
  step();
});
resetButton.addEventListener("click", reset);
clearButton.addEventListener("click", () => {
  codeInput.value = "";
  reset();
  codeInput.focus();
});
clearConsoleButton.addEventListener("click", () => {
  state.output = [];
  renderConsole();
});
speedInput.addEventListener("input", () => {
  speedValue.textContent = `${speedInput.value} 步/s`;
  if (state.running) {
    clearInterval(state.timer);
    state.timer = setInterval(step, 1000 / Number(speedInput.value));
  }
});
consoleInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    submitInput(consoleInput.value);
  }
});
inputForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitInput(consoleInput.value);
});
codeInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    state.running ? pause() : start();
  }
  if (event.key === "Tab") {
    event.preventDefault();
    const start = codeInput.selectionStart;
    const end = codeInput.selectionEnd;
    codeInput.setRangeText("    ", start, end, "end");
    parseProgram();
  }
});

codeInput.value = PROGRAMS.program1;
loadImages();
reset();
