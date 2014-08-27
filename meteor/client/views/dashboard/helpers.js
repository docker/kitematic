Handlebars.registerHelper('activeDashboardMenuItem', function (page) {
  var currentPage = Router.current(true).path.split('/')[1];
  return page === currentPage ? 'active' : '';
});

Handlebars.registerHelper('activeDashboardSubMenuItem', function (page) {
  var currentPage = Router.current(true).path.split('/')[3];
  return page === currentPage ? 'active' : '';
});

Handlebars.registerHelper('currentDashboardPage', function () {
  var currentPage = Router.current(true).path.split('/')[1];
  return currentPage;
});
