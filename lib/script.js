// Parametros gerais do canvas
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

// Setar primeiro valor da largura e comprimento do canvas
canvas.width = window.innerWidth
canvas.height = window.innerHeight

// Offset do canvas
var offsetX = canvas.offsetLeft;
var offsetY = canvas.offsetTop;

// Variavel global que indica se o missil esta se movendo
var moving = false

var currentX = 150; // Posicao X inicial do missil
var currentY = 600; // Posicao Y inicial do missil

var mouseX; // Posicao X do mouse
var mouseY; // Posicao Y do mouse

// Variaveis para a animacao do missil indo em direcao ao aviao
var frameCount = 60;
var timer;
var points;
var currentFrame;
var FrameExplosion;


// Mudar valor da largura e comprimento do canvas quando houver resize da tela
window.addEventListener('resize', e => {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
})

/*
Funcao para desenhar a imagem do missil apontando para uma posicao especifica
Baseado em https://stackoverflow.com/questions/40120470/javascript-making-image-rotate-to-always-look-at-mouse-cursor
*/

function drawImageLookat(img, x, y, lookx, looky){
  ctx.setTransform(1, 0, 0, 1, x, y);
  // Rotacionar a imagem em 45 graus, pois a imagem original do missil esta rotacionada
  ctx.rotate(Math.atan2(looky - y, lookx - x) + Math.PI / 4);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/*
Funcao que desenha o aviao e o missil apontando para ele ao mover o mouse caso o missil nao esteja se movendo
Baseado em https://stackoverflow.com/questions/51403693/image-following-a-mouse-on-a-canvas
*/
canvas.addEventListener('mousemove', e => {
    if(!moving) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Posicao do mouse na tela
      mouseX = e.pageX - offsetX
      mouseY = e.pageY - offsetY

      // Desenhar aviao
      let plane = new Image();
      plane.src = "https://i.ibb.co/mNrYsF5/airplane-icon-png-2519.png";
      ctx.beginPath();
      ctx.drawImage(plane, mouseX - plane.width/2, mouseY -  plane.height/2);

      // Desenhar missil
      let missile = new Image();
      missile.src = "https://i.ibb.co/GMkCVYC/Military-Missile-icon.png";
      drawImageLookat(missile, currentX, currentY, mouseX, mouseY);
    
    }
})

/*
Classe para os sons
Baseado em https://www.w3schools.com/graphics/game_sound.asp
*/
function sound(src) {
  this.sound = document.createElement("audio");
  this.sound.src = src;
  this.sound.setAttribute("preload", "auto");
  this.sound.setAttribute("controls", "none");
  this.sound.style.display = "none";
  document.body.appendChild(this.sound);
  this.play = function(){
    this.sound.play();
  }
  this.stop = function(){
    this.sound.pause();
    this.sound.load(); //Reiniciar o audio
  }
  this.ended = function(){ // Verificar se o audio terminou
    return this.sound.ended;
  }
}

var LaunchMusic = new sound("music/435416__v-ktor__explosion13.wav"); // Audio de lancamento do missil
var CollisionMusic = new sound("music/455530__befig__2019-explosion.wav"); // Audio de colisao do missil
var SoundHabilited = true // Variavel para verificar se o som esta habilitado

/*
Funcao para mudar habilitar ou desabilitar sons ao clique do botao
*/
function changeSound(){
  var element = document.getElementById("myButton");
  if (SoundHabilited) {
    SoundHabilited = false;
    element.textContent = "Habilitar som";
    // Parar musicas que estavam tocando
    LaunchMusic.stop();
    CollisionMusic.stop();
  }
  else {
    SoundHabilited = true;
    element.textContent = "Desabilitar som";
  }
}

/*
Funcao para salvar num vetor os pontos que serao percorrido pelo missil em um certo numero de frames
Baseado em https://stackoverflow.com/questions/16755991/html5-canvas-moving-object-to-mouse-click-position
*/
function linePoints(x1, y1, x2, y2, frames) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  var incrementX = dx / frames;
  var incrementY = dy / frames;
  var a = new Array();

  a.push({
      x: x1,
      y: y1
  });
  for (var frame = 0; frame < frames - 1; frame++) {
      a.push({
          x: x1 + (incrementX * frame),
          y: y1 + (incrementY * frame)
      });
  }
  a.push({
      x: x2,
      y: y2
  });
  return (a);
}

/*
Funcao para desenhar o percurso do missil por um certo numero de frames
Baseado em https://stackoverflow.com/questions/16755991/html5-canvas-moving-object-to-mouse-click-position
*/
function animateMissile() {
    var point = points[currentFrame++];
    drawMissileMove(point.x, point.y);

    // Chamar a si mesmo enquanto o numero de frames nao alcanca o limite dado pelo tamanho de pontos que serao percorrido pelo missil
    if (currentFrame < points.length) {
        timer = setTimeout(animateMissile, 1000 / 60);
    }
}

/*
Funcao para desenhar o percurso do missil
Baseado em https://stackoverflow.com/questions/16755991/html5-canvas-moving-object-to-mouse-click-position
*/
function drawMissileMove(x, y) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar aviao
    let plane = new Image();
    plane.src = "https://i.ibb.co/mNrYsF5/airplane-icon-png-2519.png";
    ctx.beginPath();
    ctx.drawImage(plane, mouseX - plane.width/2, mouseY -  plane.height/2);
    
    // Se o missil nao tiver chegado ao alvo, desenha-lo
    if(x != mouseX && y != mouseY){
      let missile = new Image();
      missile.src = "https://i.ibb.co/GMkCVYC/Military-Missile-icon.png";
      drawImageLookat(missile, x, y, mouseX ,mouseY);
    }
    else { // Se o alvo foi alcancado
      if (SoundHabilited) {
        LaunchMusic.stop(); // Parar musica de lancamento

        // Reiniciar musica de colisao se ela nao tiver terminado e toca-la novamente
        if (!CollisionMusic.ended()) {
          CollisionMusic.stop();
        }
        CollisionMusic.play();
      }

      /*
      Criar particulas que irao explodir
      Baseado em https://bl.ocks.org/nanu146/aa0e4f8428bc65a8c648cf0ddefc84d4
      */

      FrameExplosion = 0;
      particles=[];
			numparticles=500;
			for(i=0;i<numparticles;i++){
			particles.push(particle.create(mouseX,mouseY,(Math.random()*10)+5,Math.random()*Math.PI*2))
			}
      
      // Desenhar as particulas de explosao
      updateExplosion();
    }
    
    ctx.stroke();
}

/*
Funcao para desenhar ativar o percurso do missil quando se clica no mouse e o missil nao esta se movimentando
Baseado em https://stackoverflow.com/questions/16755991/html5-canvas-moving-object-to-mouse-click-position
*/
canvas.addEventListener('mousedown', e => {

    if(!moving) {
      mouseX = e.pageX - offsetX;
      mouseY = e.pageY - offsetY;
      
      points = linePoints(currentX, currentY, mouseX, mouseY, frameCount);
      currentFrame = 0;
      currentX = mouseX;
      currentY = mouseY;
      if (SoundHabilited) { // Tocar musica de lancamento e parar musica de colisao
        CollisionMusic.stop();
        LaunchMusic.play();
      }
      moving = true; // O movimento do missil esta acontecendo
      animateMissile();
    }
    
})

/*
Classe das particulas de explosao
Baseado em https://bl.ocks.org/nanu146/aa0e4f8428bc65a8c648cf0ddefc84d4
*/
particle=
{
	velocity :null,
	position : null,

	create : function(x,y,speed,angle)
	{
		var obj=Object.create(this);
		obj.velocity=vector.create(0,0);
		
		obj.velocity.setLength(speed);
		obj.velocity.setAngle(angle);
		obj.position=vector.create(x,y);
		return obj;
	},

	update: function(){
		this.position.addTo(this.velocity);
	}

}

/*
Classe vetor auxiliar para definir as particulas de explosao
Baseado em https://bl.ocks.org/nanu146/aa0e4f8428bc65a8c648cf0ddefc84d4
*/
vector=
{
	_x:0,
	_y:0,

	create : function(x,y){var obj= Object.create(this);obj._y=y; obj._x=x; return obj;},

	getX : function(){ return this._x},
	getY : function(){ return this._y},
	setX : function(value){  this._x=value;},
	setY : function(value){  this._y=value;},
	getLength : function(){ return Math.sqrt(this._x*this._x + this._y*this._y)},
	getAngle : function(){ return Math.atan2(this._y,this._x) },
	setAngle : function(angle){ length=this.getLength(); this._y =Math.cos(angle)*length; this._x= Math.sin(angle)*length; },
	setLength: function(length){ angle=this.getAngle(); this._y=Math.cos(angle)*length; this._x=Math.sin(angle)*length; },
	add : function(v2){		vect = this.create(this._x+v2._x, this._y+v2._y);	return vect;	 },
	subtract : function(v2){	vect = this.create(this._x-v2._x, this._y-v2._y); 	return vect;	 },
	multiply: function(value){ return vector.create(this._x*value,this._y*value)},
	divide: function(value){ return vector.create(this._x/value,this._y/value)},
	scale: function(value){ this._x=this._x*value; this._y=this._y*value;},
	addTo: function(v2){ this._x=this._x+v2._x; this._y=this._y+v2._y },
	subtractFrom: function(v2){ this._x=this._x-v2._x; this._y=this._y-v2._y }
}

/*
Funcao para desenhar a animacao das particulas de explosao
Baseado em https://bl.ocks.org/nanu146/aa0e4f8428bc65a8c648cf0ddefc84d4
*/
function updateExplosion(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  
  FrameExplosion++;

  // Desenhar aviao
  let plane = new Image();
      plane.src = "https://i.ibb.co/mNrYsF5/airplane-icon-png-2519.png";
    ctx.beginPath();
      ctx.drawImage(plane, mouseX - plane.width/2, mouseY -  plane.height/2);

  // Desenhar a explosao
  for (var i = 0; i < numparticles; i++) {
  particles[i].update();
  ctx.beginPath();
  ctx.arc(particles[i].position.getX(),particles[i].position.getY(),3,0,2*Math.PI,false);
  ctx.fill();
  }

  // A funcao chama a si mesma por 100 frames
  if (FrameExplosion < 100){
    timer = setTimeout(updateExplosion, 1000 / 60);
  }
  else {
    moving = false; // Quando terminar a animacao, acaba o movimento do missil
  }

}