// Generated by CoffeeScript 1.9.1
(function() {
  var message;

  switch (newLevel) {
    case 1:
      message = 'Time to get up';
      break;
    case 2:
      message = 'Good morning! Let\'s go run!';
      break;
    default:
      message = 'You should stop now, go code something fun';
  }

  if (typeof newLevel !== "undefined" && newLevel !== null) {
    checkLevel(newLevel);
  } else {
    resetLevel();
  }

}).call(this);

//# sourceMappingURL=coffeeScriptExamples.js.map