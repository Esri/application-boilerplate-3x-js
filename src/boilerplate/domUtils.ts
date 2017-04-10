/// <amd-dependency path="dojo/i18n!application/nls/resources.js" name="i18n" />
declare const i18n: any;

const CSS = {
  loading: "boilerplate--loading",
  error: "boilerplate--error",
  errorIcon: "esri-icon-notice-round"
};

//--------------------------------------------------------------------------
//
//  Public Methods
//
//--------------------------------------------------------------------------

export function setPageLocale(locale: string): void {
  document.documentElement.lang = locale;
}

export function setPageDirection(direction: string): void {
  const dirNode = document.getElementsByTagName("html")[0];
  dirNode.setAttribute("dir", direction);
}

export function setPageTitle(title: string): void {
  document.title = title;
}

export function removePageLoading(): void {
  document.body.classList.remove(CSS.loading);
}

export function addPageError(error: Error): void {
  removePageLoading();
  document.body.classList.add(CSS.error);
  const node = document.getElementById("loading_message");
  if (node) {
    node.innerHTML = `<h1><span class="${CSS.errorIcon}"></span> ${i18n.error}</h1><p>${error.message}</p>`;
  }
}
