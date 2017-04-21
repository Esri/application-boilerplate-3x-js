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
