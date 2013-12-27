Handlebars.registerHelper('arrayify',function(obj){
    result = [];
    for (var key in obj) result.push({key:key,value:obj[key]});
    return result;
});

Handlebars.registerHelper("equals", function(x, y) {
  return x == y;
})
