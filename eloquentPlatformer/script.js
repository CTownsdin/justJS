'use strict';

// actorChars obj dict contains refs to ctors
var actorChars = {
  "@": Player,
  "o": Coin,
  "=": Lava, 
  "|": Lava,
  "v": Lava
};


function Vector(x, y) { 
  this.x = x; this.y = y; 
}
Vector.prototype.plus = function(other){
  return new Vector(this.x + other.x, this.y + other.y);
};
Vector.prototype.times = function(factor){
  return new Vector(this.x * factor, this.y * factor);
};


function Level(plan) {
  this.width = plan[0].length;
  this.height = plan.length;
  this.grid = [];
  this.actors = [];

  // foreach line
  for (var y = 0; y < this.height; y++) {
    var line = plan[y],
      gridLine = [];
    // foreach char in each line of the plan
    for (var x = 0; x < this.width; x++) {
      var ch = line[x];  // a char
      var fieldType = null;
      var Actor = actorChars[ch];  // Actor is the ctor from the actorChars obj dict
      if (Actor) {  // if Actor was in actorChars obj dict, then...
        // console.log('found an Actor from dict: ' + Actor);
        this.actors.push(new Actor(new Vector(x, y), ch));  //
      }
      else if (ch == "x") {  //TODO:  Q?  DRAW OTHERS??  WHO draws the actors arr ?
        fieldType = "wall";
      }
      else if (ch == "!"){  // Q: other lava's ?
        fieldType = "lava";
      }
      gridLine.push(fieldType);
    }
    this.grid.push(gridLine);
  }  // end for loops
  
  console.log('actors array: ' + this.actors);
  
  // set  Level.player  by filter thru actors
  this.player = this.actors.filter(
    function(actor) { return actor.type == "player"; }) [0];
  
  this.status = this.finishDelay = null; 
}
Level.prototype.isFinished = function() {
  return this.status != null && this.finishDelay < 0;  // TODO:  TEST !== here!
};
Level.prototype.obstacleAt = function(pos, size) {  // bf player move
  var xStart = Math.floor(pos.x);
  var xEnd = Math.ceil(pos.x + size.x);
  var yStart = Math.floor(pos.y);
  var yEnd = Math.ceil(pos.y + size.y);
  
  // if falling out of the world, return wall or lava
  if (xStart < 0 || xEnd > this.width || yStart < 0){
    return "wall";
  }
  if (yEnd > this.height){  // for this simple level design
    return "lava";
  }
  // else, return first nonempty fieldType ie bg_square_type
  for (var y = yStart; y < yEnd; y++) {
    for (var x = xStart; x < xEnd; x++) {
      var fieldType = this.grid[y][x];
      if (fieldType){ return fieldType; }
    }
  };
};
//  Scan the array of actors looking for any that overlap with the actor arg
Level.prototype.actorAt = function(actor) {
  for (var i = 0; i < this.actors.length; i++) {
    var other = this.actors[i];
    if (
      other != actor &&
      actor.pos.x + actor.size.x > other.pos.x &&
      actor.pos.x < other.pos.x + other.size.x &&
      actor.pos.y + actor.size.y > other.pos.y &&
      actor.pos.y < other.pos.y + other.size.y
      ) { 
      return other; 
    }
  }
};
var maxStep = 0.05;
Level.prototype.animate = function(step, keys) {  // step is time in s, keys is which arrow pressed
  if (this.status != null) { this.finishDelay -= step; }
  
  while (step > 0) {
    var thisStep = Math.min(step, maxStep);  // which is smaller, hence maxStep
    this.actors.forEach(function(actor) {
      actor.act(thisStep, this, keys);
    }, this);
    step -= thisStep;
  }
};


// create an element and give it a class
function elt(name, className) {
  var el = document.createElement(name); 
  if (className){ el.className = className; }
  return el;
}


// num of pixels that a single unit takes up on the screen
var scale = 20;
function DOMDisplay(parent, level){
  // parent = document.body
  // thf...  document.body.appendChild( document.createElement('div').className('game') );
  this.wrap = parent.appendChild(elt('div', 'game'));  // the div .game wrapper
  this.level = level;
  
  this.wrap.appendChild(this.drawBackground());
  this.actorLayer = null;  // used by drawFrame to track el that holds actors
  this.drawFrame();  // drawFrame includes drawing the actors 
}
// background is drawn as a <table> elt
DOMDisplay.prototype.drawBackground = function() {
  var table = elt('table', 'background');
  table.style.width = this.level.width * scale + 'px';
  this.level.grid.forEach(function(row) {
    var rowElt = table.appendChild(elt('tr'));
    rowElt.style.height = scale + 'px';
    row.forEach(function(type) {
      rowElt.appendChild(elt('td', type));
    });
  });
  return table;
};
DOMDisplay.prototype.drawActors = function() {
  var wrap = elt('div');
  this.level.actors.forEach(function(actor) {
    var rect = wrap.appendChild(elt('div', 'actor ' + actor.type));  // class = "actor coin"
    rect.style.width = actor.size.x * scale + 'px';  // style="width: 12px"
    rect.style.height = actor.size.y * scale + 'px';
    rect.style.left = actor.pos.x * scale + 'px';
    rect.style.top = actor.pos.y * scale + 'px';
  });
  return wrap;  // ex:  <div class="actor coin" style="width: 12px; height: 12px; left: 304px; top: 62px;"></div>
};
DOMDisplay.prototype.drawFrame = function() {
  if (this.actorLayer) {  // if there, remove it, else cont normally making ie the first time...
    this.wrap.removeChild(this.actorLayer);
  }
  this.actorLayer = this.wrap.appendChild(this.drawActors());  // set this.actorLayer
  this.wrap.className = "game " + (this.level.status || "");
  this.scrollPlayerIntoView();
};
DOMDisplay.prototype.scrollPlayerIntoView = function() {
  var width = this.wrap.clientWidth;
  var height = this.wrap.clientHeight;
  var margin = width / 3; 
  
  // The viewport
  var left = this.wrap.scrollLeft, right = left + width;
  var top = this.wrap.scrollTop, bottom = top + height;
  
  var player = this.level.player;
  var center = player.pos.plus(player.size.times(0.5)).times(scale);
  
  if (center.x < left + margin) { 
    this.wrap.scrollLeft = center.x - margin;
  }
  else if (center.x > right - margin) {
    this.wrap.scrollLeft = center.x + margin - width;
  } 
  if (center.y < top + margin) {
    this.wrap.scrollTop = center.y - margin;
  }
  else if (center.y > bottom - margin) {
    this.wrap.scrollTop = center.y + margin - height;
  }
};
DOMDisplay.prototype.clear = function() {
  this.wrap.parentNode.removeChild(this.wrap);
};



/****************************Instantiate Objects**************************/

var simplePlan = [
  "                       ",
  "                       ",
  "  x               = x  ",
  "  x          o o    x  ",
  "  x @       xxxxx   x  ",
  "  xxxxx             x  ",
  "      x!!!!!!!!!!!!!x  ",
  "      xxxxxxxxxxxxxxx  ",
  "                       "
];

var simpleLevel = new Level(simplePlan);
var display = new DOMDisplay(document.body, simpleLevel);
