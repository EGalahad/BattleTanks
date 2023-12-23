class PBar {
  class_name: string;
  id: string;
  totalTime: number;
  timeout: number;

  element: HTMLElement;
  valueElement: HTMLElement;
  fillElement: HTMLElement;

  constructor(container: HTMLElement, class_name: string, type: string, totalTime: number) {
    this.class_name = class_name;
    this.id = `${class_name}-${type}`;
    this.totalTime = totalTime;
    this.timeout = totalTime;

    let html = `
    <div class="${class_name}" id="${class_name}-${type}">
      <div class="${class_name}__text">${type}</div>
      <div class="${class_name}__bar">
        <div class="${class_name}__bar__fill"></div>
      </div>
      <div class="${class_name}__value">${(totalTime / 1000).toFixed(1)}s</div>
    </div>
  `;
    container.insertAdjacentHTML("beforeend", html);

    this.element = document.getElementById(this.id) as HTMLElement;
    this.fillElement = this.element.getElementsByClassName(class_name + "__bar__fill")[0] as HTMLElement;
    this.valueElement = this.element.getElementsByClassName(class_name + "__value")[0] as HTMLElement;
    
    this.update(this.timeout);
  }

  update(value: number, remove: boolean = true) {
    this.timeout = value;
    this.fillElement.style.width = `${value / this.totalTime * 100}%`;
    this.valueElement.innerText = `${(value / 1000).toFixed(1)}s`;
    if (value <= 0 && remove) {
      this.element.remove();
    }
  }

  remove() {
    this.element.remove();
  }
}

export { PBar }