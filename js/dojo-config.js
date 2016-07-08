var package_path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/"));
var dojoConfig = {
  async: true,
  packages: [{
    name: "application",
    location: package_path + "/js/application",
    main: "Main"
  }, {
    name: "boilerplate",
    location: package_path + "/js/boilerplate",
    main: "Boilerplate"
  }, {
    name: "config",
    location: package_path + "/config",
    main: "defaults"
  }]
};
