(() => {
  class Queue {
    elements = [];
  
    push(e) {
      this.elements.push(e);
    }
    pop() {
      return this.elements.shift();
    }
    isEmpty() {
      return this.elements.length == 0;
    }
    size() {
      return this.elements.length;
    }
    remove(e) {
      let index = this.elements.indexOf(e);
      if (index > -1) {
        this.elements.splice(index, 1);
      }
    }
  }
  
  const timeout = ms => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  class NotificationQueue {
    size;
    elements = new Queue();
    container;
    constructor({size = 3, container}) {
      this.size = size;
      this.container = container;
    }
  
    async push({icon = "information-circle-outline", style = "default", content, dismissible = true}) {
      const el = document.createElement("div");
      el.classList.add("notification");
      el.classList.add("away");
      if(dismissible) el.classList.add("dismissible");
      if(["success", "error", "warning", "info"].includes(style)) el.classList.add(style);
      el.innerHTML = `
      <div class="icon-container">
        <ion-icon name="${icon}"></ion-icon>
      </div>
      <div class="message-container">
        <p>${content}</p>
      </div>
      <button type="button" class="close-btn">
        <ion-icon name="close-circle-outline"></ion-icon>
      </button>`
      this.elements.push(el);
      this.container.prepend(el);
      await timeout(1);
      el.classList.remove("away")
      const removeEl = () => {
        this.elements.remove(el);
        this.remove(el);
      }
      el.querySelector("button").addEventListener("click", removeEl);
      
      while(this.elements.size() > this.size) this.pop();
      return removeEl;
    }
  
    pop() {
      const el = this.elements.pop();
      this.remove(el);
    }
  
    async remove(el) {
      if(this.container.contains(el)) {
        el.classList.add("away");
        el.style.height = el.offsetHeight + "px";
        await timeout(250);
        el.style.height = 0;
        await timeout(100);
        this.container.removeChild(el);
      }
    }
  
  }
  
  const nm = new NotificationQueue({
    container: document.getElementById("notifications"),
    size: 3
  });
  
  
  document.getElementById("toggle").addEventListener("click", () => {
    const controls = document.getElementById("controls");
    if(controls.classList.contains("closed")) controls.classList.remove("closed");
    else controls.classList.add("closed");
  });
  
  let selecting = null;
  let lastSelectedStarting = null;
  let lastSelectedTarget = null;
  let barriersCount = 0;
  
  let startCoord = null;
  
  const rowsCount = document.getElementById("rows_count");
  const columnsCount = document.getElementById("columns_count");
  const startingBtn = document.getElementById("starting-button");
  const targetBtn = document.getElementById("target-button");
  const barriersBtn = document.getElementById("barriers-button");
  const simulateBtn = document.getElementById("simulate-button");
  const resetBtn = document.getElementById("reset-button");
  const checkStart = document.getElementById("check-start");
  const checkTarget = document.getElementById("check-target");
  const checkBarriers = document.getElementById("check-barriers");
  
  const root = document.getElementById("root");
  let matrix = [];
  let visited = null;
  
  
  let n = rowsCount.value;
  let m = columnsCount.value;
  
  const updateGrid = () => {
    n = rowsCount.value;
    m = columnsCount.value;
    visited = new Array(n);
    for (let i = 0; i < n; i++) {
      visited[i] = new Array(m);
      for (let j = 0; j < m; j++) {
        visited[i][j] = false;
      }
    }
    root.innerHTML = "";
    for (let i = 0; i < n; i++) {
      let row = document.createElement("div");
      let matrixRow = [];
      // debugger;
      row.classList.add("grid-row");
      for (let j = 0; j < m; j++) {
        let box = document.createElement("div");
        box.classList.add("grid-box");
        box.dataset.x = i;
        box.dataset.y = j;
        box.id = `b_${i}_${j}`;
        row.appendChild(box);
  
        matrixRow.push(0);
      }
      root.appendChild(row);
      matrix.push(matrixRow);
    }
    updateChecklist();
  }
  
  const selectCell = (ev) => {
  
    return () => {
      // close the controls
      if(!controls.classList.contains("closed")) controls.classList.add("closed");
      selecting = ev;
    }
  }
  
  const updateChecklist = () => {
    if(lastSelectedStarting) {
      if(!checkStart.classList.contains("active")) checkStart.classList.add("active");
      checkStart.innerHTML = '<ion-icon name="checkmark-circle-outline"></ion-icon> Start';
    } else {
      if(checkStart.classList.contains("active")) checkStart.classList.remove("active");
      checkStart.innerHTML = '<ion-icon name="close-circle-outline"></ion-icon> Start';
    }
    
    if(lastSelectedTarget) {
      if(!checkTarget.classList.contains("active")) checkTarget.classList.add("active");
      checkTarget.innerHTML = '<ion-icon name="checkmark-circle-outline"></ion-icon> Target';
    } else {
      if(checkTarget.classList.contains("active")) checkTarget.classList.remove("active");
      checkTarget.innerHTML = '<ion-icon name="close-circle-outline"></ion-icon> Target';
    }
  
    if(barriersCount > 0) {
      if(!checkBarriers.classList.contains("active")) checkBarriers.classList.add("active");
      checkBarriers.innerHTML = '<ion-icon name="checkmark-circle-outline"></ion-icon> Barriers'; // (' + barriersCount + ')';
    } else {
      if(checkBarriers.classList.contains("active")) checkBarriers.classList.remove("active");
      checkBarriers.innerHTML = '<ion-icon name="help-circle-outline"></ion-icon> Barriers';
    }
  
    
    // console.log(matrix);
    // console.log(visited);
  }
  
  const activateFields = () => {
    rowsCount.removeAttribute("disabled");
    rowsCount.parentElement.classList.remove("disabled");
    columnsCount.removeAttribute("disabled");
    columnsCount.parentElement.classList.remove("disabled");
    startingBtn.removeAttribute("disabled");
    targetBtn.removeAttribute("disabled");
    barriersBtn.removeAttribute("disabled");
    simulateBtn.removeAttribute("disabled");
  }
  const deactivateFields = () => {
    rowsCount.setAttribute("disabled", true);
    rowsCount.parentElement.classList.add("disabled");
    columnsCount.setAttribute("disabled", true);
    columnsCount.parentElement.classList.add("disabled");
    startingBtn.setAttribute("disabled", true);
    targetBtn.setAttribute("disabled", true);
    barriersBtn.setAttribute("disabled", true);
    simulateBtn.setAttribute("disabled", true);
  }
  
  updateGrid();
  
  const resetInternals = () => {
    matrix = [];
    visited = null;
    selecting = null;
    lastSelectedStarting = null;
    lastSelectedTarget = null;
    barriersCount = 0;
    startCoord = null;
    updateGrid();
  };
  
  rowsCount.addEventListener("change", resetInternals);
  columnsCount.addEventListener("change", resetInternals);
  startingBtn.addEventListener("click", selectCell("starting"));
  targetBtn.addEventListener("click", selectCell("target"));
  barriersBtn.addEventListener("click", selectCell("barriers"));
  
  
  root.addEventListener("click", (e) => {
    // console.log(e.target);
    const target = e.target;
  
    if(!target.classList.contains("grid-box") || selecting == null) return;
  
    if(selecting == "starting") {
      // console.log(e);
      if(lastSelectedStarting) {
        lastSelectedStarting.classList.remove("starting");
        lastSelectedStarting.innerHTML = "";
        matrix[lastSelectedStarting.dataset.x][lastSelectedStarting.dataset.y] = 0;
      }
      if(target.classList.contains("target")) {
        target.classList.remove("target");
        target.innerHTML = "";
        lastSelectedTarget = null;
      }
      if(target.classList.contains("barrier")) {
        target.classList.remove("barrier");
        target.innerHTML = "";
        --barriersCount;
      }
      lastSelectedStarting = target;
      lastSelectedStarting.classList.add("starting");
      lastSelectedStarting.innerHTML = '<ion-icon name="home-outline"></ion-icon>';
  
      matrix[target.dataset.x][target.dataset.y] = 1;
      startCoord = [Number(target.dataset.x), Number(target.dataset.y)];
  
      selecting = null;
      if(controls.classList.contains("closed")) controls.classList.remove("closed");
    } else if(selecting == "target") {
      // console.log(e);
      if(lastSelectedTarget) {
        lastSelectedTarget.classList.remove("target");
        lastSelectedTarget.innerHTML = "";
        matrix[lastSelectedTarget.dataset.x][lastSelectedTarget.dataset.y] = 0;
      }
      if(target.classList.contains("starting")) {
        target.classList.remove("starting");
        target.innerHTML = "";
        lastSelectedStarting = null;
      }
      if(target.classList.contains("barrier")) {
        target.classList.remove("barrier");
        target.innerHTML = "";
        --barriersCount;
      }
      lastSelectedTarget = target;
      lastSelectedTarget.classList.add("target");
      lastSelectedTarget.innerHTML = '<ion-icon name="golf-outline"></ion-icon>';
  
      matrix[target.dataset.x][target.dataset.y] = 2;
  
      selecting = null;
      if(controls.classList.contains("closed")) controls.classList.remove("closed");
    } else if(selecting == "barriers") {
      // console.log(e);
      
      if(target.classList.contains("starting")) {
        target.classList.remove("starting");
        target.innerHTML = "";
        lastSelectedStarting = null;
      }
      if(target.classList.contains("target")) {
        target.classList.remove("target");
        target.innerHTML = "";
        lastSelectedTarget = null;
      }
  
      if(!target.classList.contains("barrier")) {
        target.classList.add("barrier");
        target.innerHTML = '<ion-icon name="close-outline"></ion-icon>';
        matrix[target.dataset.x][target.dataset.y] = 3;
        ++barriersCount;
      } else {
        target.classList.remove("barrier");
        target.innerHTML = "";
        matrix[target.dataset.x][target.dataset.y] = 0;
        --barriersCount;
      }
    }
  
    updateChecklist();
  
  });
  
  
  simulateBtn.addEventListener("click", async () => {
    // TODO: check if checklist is complete
    if(!lastSelectedStarting || !lastSelectedTarget) {
      nm.push({
        content: "Please, choose a start and a target.",
        style: "warning",
        icon: "warning-outline"
      });
      return;
    }
    if(!controls.classList.contains("closed")) controls.classList.add("closed");
    deactivateFields();
    resetBtn.setAttribute("disabled", true);
    // console.log(startCoord);
    const q = new Queue();
    const parent = new Map();
    parent[startCoord] = [-1, -1];
    q.push(startCoord);
    let end = null;
    while(!q.isEmpty()) {
      let [current_x, current_y] = q.pop();
      current_x = Number(current_x);
      current_y = Number(current_y);
      if(!visited[current_x][current_y]) {
        visited[current_x][current_y] = true;
        _visited(current_x, current_y);
        // console.log("current matrix ", matrix[current_x][current_y]);
        await timeout(50);
        if(matrix[current_x][current_y] == 2) {
          end = [current_x, current_y];
          break;
        }
        await timeout(50);
        if(valid(current_x + 1, current_y)) {
          q.push([current_x + 1, current_y]);
          _visiting(current_x + 1, current_y);
          if(!visited[current_x + 1][current_y]) parent[[current_x + 1, current_y]] = [current_x, current_y];
        }
        if(valid(current_x, current_y - 1)) {
          q.push([current_x, current_y - 1]);
          _visiting(current_x, current_y - 1);
          if(!visited[current_x][current_y - 1]) parent[[current_x, current_y - 1]] = [current_x, current_y];
        }
        if(valid(current_x - 1, current_y)) {
          q.push([current_x - 1, current_y]);
          _visiting(current_x - 1, current_y);
          if(!visited[current_x - 1][current_y]) parent[[current_x - 1, current_y]] = [current_x, current_y];
        }
        if(valid(current_x, current_y + 1)) {
          q.push([current_x, current_y + 1]);
          _visiting(current_x, current_y + 1);
          if(!visited[current_x][current_y + 1]) parent[[current_x, current_y + 1]] = [current_x, current_y];
        }
      }
    }
    // console.log("end", end);
    // console.log(parent)
    // debugger;
    if(end != null) {
      let i = 0;
      while(end[0] !== -1 && end[1] != -1) {
        // color
        // console.log(end)
        _paintPath(end[0], end[1]);
        ++i;
        end = parent[end];
      }
      nm.push({
        content: `Simulation done. The length of the shortest path through BFS is ${i-1}.`,
        style: "success",
        icon: "checkmark-outline"
      });
    } else {
      nm.push({
        content: "No path was found from start node to the target node.",
        style: "error",
        icon: "golf-outline"
      });
    }
    resetBtn.removeAttribute("disabled");
    // debugger;
  });
  
  resetBtn.addEventListener("click", () => {
    resetInternals();
    activateFields();
    nm.push({
      content: "Grid was successfully reset.",
      style: "success",
      icon: "refresh-outline"
    });
  });
  const valid = (x, y) => {
    // console.log(matrix, x, y)
    if(x >=0 && x < n && y >= 0 && y < m) 
      return matrix[x][y] != 3;
    return false;
  }
  const _visited = (x, y) => {
    const id = `b_${x}_${y}`;
    const node = document.getElementById(id);
    if(node) {
      if(node.classList.contains('visiting')) node.classList.remove('visiting');
      node.classList.add('visited');
    }
  }
  const _paintPath = (x, y) => {
    const id = `b_${x}_${y}`;
    const node = document.getElementById(id);
    if(node) {
      node.classList.add('path');
    }
  }
  const _visiting = (x, y) => {
    const id = `b_${x}_${y}`;
    const node = document.getElementById(id);
    if(node) {
      if(node.classList.contains('starting') || node.classList.contains('target')) return;
      node.classList.add('visiting');
    }
  }
  
  
  nm.push({
    content: `
    Only the <span style="color: #86c7a1;">start node</span> and the <span style="color: #8db9d6;">target node</span> are required to begin the simulation, <span style="color: #e6a8a1;">barriers</span> are optional.
    <br><span style="color:white;font-size:11px;display:inline-block;margin-top:4px;">Code by: Amaan Shaikh, Shriya Pingulkar, Shubham Verma and Aryaman Tiwary</span>`,
    icon: "information-circle-outline",
    style: "info"
  });
})();