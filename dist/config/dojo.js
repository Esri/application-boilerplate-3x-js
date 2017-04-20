var package_path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/"));
dojoConfig = {
  async: true,
  packages: [
    {
      name: "application",
      location: package_path + "/application",
      main: "Application"
    },
    {
      name: "boilerplate",
      location: package_path + "/boilerplate",
      main: "Boilerplate"
    },
    {
      name: "config",
      location: package_path + "/config"
    }
  ]
};
if (location.search.match(/locale=([\w-]+)/)) {
  dojoConfig.locale = RegExp.$1;
}
