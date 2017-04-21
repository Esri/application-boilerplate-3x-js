interface PageErrorArguments {
  title: string;
  message: string;
}

const CSS = {
  // calcite
  isActive: "is-active",
  alert: "alert",
  modifier: "modifier-class",
  errorIcon: "icon-ui-error2",

  // boilerplate
  error: "boilerplate__error",
  loading: "boilerplate--loading"
}


export function removePageLoading(): void {
  document.body.classList.remove(CSS.loading);
}

export function addPageError(args: PageErrorArguments): void {
  removePageLoading();

  const errorNode = document.createElement("div");
  errorNode.className = CSS.error;
  errorNode.innerHTML = `
    <div class="${CSS.alert} ${CSS.modifier} ${CSS.isActive}">
      <h2><span class="${CSS.errorIcon}"></span> ${args.title}</h2>
      <p>${args.message}</p>
    </div>
  `;

  document.body.insertBefore(errorNode, document.body.firstChild);
}
