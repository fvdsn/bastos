(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function(exports){

    var V2    = require('./modula/V2.js').V2;
    var Rect  = require('./modula/Rect.js').Rect;
    var Grid2 = require('./modula/Grid2.js').Grid2;
    var Transform2 = require('./modula/Transform2.js').Transform2;
    var Input = require('./modula/Input.js').Input;

    function extend(klass,parentklass,attrs){
        klass.prototype = Object.create(parentklass.prototype);
        for(attr in attrs){
            klass.prototype[attr] = attrs[attr];
        }
    }

    function FullscreenHandler(options){
        var self = this;
        options = options || {};

        this.node = options.node || document;
        this.hotkey = options.hotkey || 'f';
        this.fullscreen = false;

        this.handlerFullscreen = function(event){
            if(String.fromCharCode(event.which).toLowerCase() === self.hotkey){
                if(!self.fullscreen){
                    if(self.node.webkitRequestFullscreen){
                        console.log('fullscreen requested');
                        self.node.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                        self.fullscreen = true;
                    }else{
                        console.error('Fullscreen not available');
                    }
                }else{
                    if(this.canvas.webkitExitFullscreen){
                        this.canvas.webkitExitFullscreen();
                    }
                }
            }
        };
        this.handlerFullscreenChange = function(event){
            console.log('pointer lock requested');
            if(document.webkitFullscreenElement = self.node){
                self.node.webkitRequestPointerLock();
            }else{
                console.log('aborted');
            }
        }
        document.addEventListener('keydown',this.handlerFullscreen);
        document.addEventListener('webkitfullscreenchange',this.handlerFullscreenChange,false);
    }

    function Main(options){
        options = options || {};
        this.input = options.input;
        this.scene = options.scene;
        this.renderer  = new Renderer({main:this});
        this.running   = false;
        this.time      = 0;
        this.fps       = 60;
        this.speed     = 0.8;
        this.deltaTime = 1 / this.fps;
        this.canvas  = options.canvas;
        this.context = this.canvas.getContext('2d'); 
        this.width   = this.canvas.width;
        this.height  = this.canvas.height;
        this.scale   = 1;
        this.pos     = V2();
        this.fullscreen = new FullscreenHandler({node:this.canvas, hotkey:'f'});
        var self = this;
    }

    Main.prototype = {
        exit: function(){
            this.running = false;
        },
        start: function(){
            var self = this;
            if(this.running){
                return;
            }
            this.running = true;
            this.time = 0;
            var  time = 0;
            function loop(){
                if(!self.running){
                    return;
                }
                requestAnimationFrame(loop);
                var now = (new Date()).getTime();
                if(!time){
                    self.deltaTime = 1/self.fps;
                }else{
                    self.deltaTime = (now - time)*0.001;
                }
                self.deltaTime *= self.speed;
                time = now ;
                self.update();
                self.time += self.deltaTime;
            }
            loop();
        },
        update: function(){
            this.input.update();
            
            var style  = getComputedStyle(this.canvas);
            this.width  = parseInt(style.width);
            this.height = parseInt(style.height);
            this.canvas.width  = this.width;
            this.canvas.height = this.height;
            this.context.save();
            this.context.translate(Math.floor(this.width/2),Math.floor(this.height/2));
            this.context.scale(1/this.scale, 1/this.scale);
            this.context.translate(-this.pos.x,-this.pos.y);

            this.scene.main = this;
            if(!this.scene.started){
                this.scene.started = true;
                this.scene.start();
            }
            this.scene.update();
            this.context.restore();
        },
        mouse: function(){
            var pos = this.input.pos;
            pos = pos.sub(V2(this.width,this.height).scale(0.5));
            pos = pos.add(this.pos);
            return pos;
        }

    };

    function Renderer(options){
        this.main = options.main;
    }
    Renderer.prototype = {
        color: function(color){
            var ctx = this.main.context;
            ctx.setFillColor(color);
            ctx.setStrokeColor(color);
        },
        line: function(sx,sy,ex,ey){
            var ctx = this.main.context;
            ctx.beginPath();
            ctx.moveTo(sx,sy);
            ctx.lineTo(ex,ey);
            ctx.stroke();
        },
        circle: function(cx, cy, radius){
            var ctx = this.main.context;
            ctx.beginPath();
            ctx.arc(cx,cy,radius,0,2*Math.PI);
            ctx.closePath();
            ctx.stroke();
        },
        disc: function(cx, cy, radius){
            var ctx = this.main.context;
            ctx.beginPath();
            ctx.arc(cx,cy,radius,0,2*Math.PI);
            ctx.closePath();
            ctx.fill();
        },
        rect: function(cx,cy,sx,sy){
            var ctx = this.main.context;
            ctx.fillRect(cx - Math.floor(sx/2),
                         cy - Math.floor(sy/2),
                         sx, sy);
        },
        box: function(cx,cy,sx,sy){
            var ctx = this.main.context;
            ctx.strokeRect(cx - Math.floor(sx/2),
                           cy - Math.floor(sy/2),
                           sx, sy);
        },
    }

    /* -------- ENNEMIES --------- */

    function Grunt(options){
        this.pos = options.pos;
        this.maxSpeed = 60;
        this.speed = V2.randomDisc().setLen(this.maxSpeed);
        this.aim   = this.speed.normalize();
        this.radius = 12;
        this.sqRadius = this.radius * this.radius;
        this.timeout = 0;
        this.fireTime = 0;
        this.fireInterval = 0.1;
        this.fireSequence = 1;
        this.projectiles = [];
        this.warmup = 0;
        this.mythosisTime = -1;
    }

    Grunt.prototype = {
        damage: function(){
            this.destroyed = true;
            for(var i = 0; i < this.projectiles.length; i++){
                this.projectiles[i].destroyed = true;
            }
        },
        update: function(){
            if(!this.timeout){
                this.timeout = this.main.time + 0.5 + Math.random()*2;
            }
            if(!this.warmup){
                this.warmup  = this.main.time + 2;
            }
            if(this.mythosisTime > 0 && this.mythosisTime < this.main.time){
                this.game.addEnemy(new Grunt({pos:this.pos})); 
                this.mythosisTime = -1;
            }
            this.pos = this.pos.addScaled(this.speed,this.main.deltaTime);

            var collision = this.game.grid.collisionVector(  
                        this.pos.x-this.radius,this.pos.y-this.radius,
                        this.pos.x+this.radius,this.pos.y+this.radius   );
            if(collision){
                this.pos = this.pos.add(collision);
            }
            if(collision || this.timeout < this.main.time){
                var playerbias = this.game.player.pos.sub(this.pos).setLen(0.2);
                this.speed = V2.randomDisc().add(playerbias).setLen(this.maxSpeed);
                this.aim   = this.speed.normalize();
                this.timeout = this.main.time + 0.5 + Math.random()*2;
            }
            if(this.pos.distSq(this.game.player.pos) < 90000){
                this.aim = this.game.player.pos.sub(this.pos).normalize();
                if(this.warmup < this.main.time && this.fireTime < this.main.time){
                    if(this.mythosisTime < 0){
                        this.mythosisTime = this.main.time + 5;
                    }
                    var proj = new GruntProjectile(this.pos,this.aim);
                    this.projectiles.push(proj);
                    this.game.addEnemyProj(proj);
                    this.fireTime = this.main.time + this.fireInterval;
                    if(!(this.fireSequence++ % 5)){
                        this.fireTime += 3 * this.fireInterval;
                    }
                }
            }

        },
        render: function(){
            var r = this.main.renderer;
            r.color('red');
            var radius = this.radius * 0.8;
            r.circle(0,0,radius);
            r.line( radius*this.aim.x * 0.5,
                    radius*this.aim.y * 0.5,
                    radius*this.aim.x * 1.5,
                    radius*this.aim.y * 1.5);
        },
    };

    function Soldier(options){
        this.pos = options.pos;
        this.maxSpeed = 60;
        this.speed = V2.randomDisc().setLen(this.maxSpeed);
        this.aim   = this.speed.normalize();
        this.radius = 15;
        this.sqRadius = this.radius * this.radius;
        this.timeout = 0;
        this.fireTime = 0;
        this.fireInterval = 0.7;
        this.fireSequence = 1;
        this.warmup = 0;
        this.health   = 10;
        this.damaged = false;
    }

    Soldier.prototype = {
        damage: function(amount){
            this.health -= amount;
            this.fireTime = this.main.time + this.fireInterval;
            if(this.health <= 0){
                this.destroyed = true;
            }
            this.damaged = true;
        },
        update: function(){
            if(!this.timeout){
                this.timeout = this.main.time + 0.8 + Math.random()*3;
            }
            if(!this.warmup){
                this.warmup  = this.main.time + 2;
            }

            this.pos = this.pos.addScaled(this.speed,this.main.deltaTime);

            var collision = this.game.grid.collisionVector(  
                        this.pos.x-this.radius,this.pos.y-this.radius,
                        this.pos.x+this.radius,this.pos.y+this.radius   );
            if(collision){
                this.pos = this.pos.add(collision);
            }
            if(collision || this.timeout < this.main.time){
                var playerbias = this.game.player.pos.sub(this.pos).setLen(0.2);
                this.speed = V2.randomDisc().add(playerbias).setLen(this.maxSpeed);
                this.aim   = this.speed.normalize();
                this.timeout = this.main.time + 0.8 + Math.random()*3;
            }
            if(this.pos.distSq(this.game.player.pos) < 250000){
                var ppos = this.game.player.pos;
                    ppos = ppos.addScaled(this.game.player.speed,ppos.sub(this.pos).len()/250 * (0.5+Math.random()*0.25));
                    ppos = ppos.addScaled(V2.randomDisc(),20);
                this.aim = ppos.sub(this.pos).normalize();
                if(this.warmup < this.main.time && this.fireTime < this.main.time){
                    var proj = new SoldierProjectile(this.pos,this.aim);
                    this.game.addEnemyProj(proj);
                    this.fireTime = this.main.time + this.fireInterval;
                }
            }

        },
        render: function(){
            var r = this.main.renderer;
            if(this.damaged){
                this.damaged = false;
                r.color('white');
            }else{
                r.color('green');
            }
            var radius = this.radius * 0.8;
            r.circle(0,0,radius);
            r.circle(0,0,radius+2);
            r.line( radius*this.aim.x * 0.5,
                    radius*this.aim.y * 0.5,
                    radius*this.aim.x * 1.5,
                    radius*this.aim.y * 1.5);
        },
    };

    function Kamikaze(options){
        this.pos = options.pos;
        this.maxSpeed = 60;
        this.chaseSpeed = 125;
        this.accel = 20;
        this.speed = V2.randomDisc().setLen(this.maxSpeed);
        this.radius = 15;
        this.sqRadius = this.radius * this.radius;
        this.timeout = 0;
        this.warmup = 0;
        this.health   = 25;
        this.damaged = false;
        this.wallDamage = 0.035;
    }

    Kamikaze.prototype = {
        damage: function(amount){
            this.health -= amount;
            this.fireTime = this.main.time + this.fireInterval;
            this.pos = this.pos.addScaled(this.speed,this.main.deltaTime* -0.3);
            if(this.health <= 0){
                this.destroyed = true;
            }
            this.damaged = true;
            this.chasing = false;
        },
        damageWall:function(){
            var self = this;
            var grid = this.game.world.grid;
            grid.pixelRect( this.pos.x-this.radius, this.pos.y-this.radius,
                            this.pos.x+this.radius, this.pos.y+this.radius,
                function(x,y,cell){
                    if(cell){
                        var value = -Math.max(0,Math.abs(cell)-self.wallDamage); // flipped to indicate damage
                        grid.setCell(x,y,value);
                    }
                });
        },
        update: function(){
            if(!this.timeout){
                this.timeout = this.main.time + 0.8 + Math.random()*3;
            }
            if(!this.warmup){
                this.warmup  = this.main.time + 2;
            }

            this.pos = this.pos.addScaled(this.speed,this.main.deltaTime);

            var collision = this.game.grid.collisionVector(  
                        this.pos.x-this.radius,this.pos.y-this.radius,
                        this.pos.x+this.radius,this.pos.y+this.radius   );
            if(collision){
                this.damageWall();
                this.pos = this.pos.add(V2(collision).setLen(5));
            }
            if(!this.chasing && (collision || this.timeout < this.main.time)){
                var playerbias = this.game.player.pos.sub(this.pos).setLen(0.2);
                this.speed = V2.randomDisc().add(playerbias).setLen(this.maxSpeed);
                this.timeout = this.main.time + 0.8 + Math.random()*3;
            }
            if(!this.chasing && this.warmup < this.main.time && this.pos.distSq(this.game.player.pos) < 150000){
                this.chasing = true;
            }
            if(this.chasing){
                this.speed = this.game.player.pos.sub(this.pos).setLen(this.chaseSpeed);
            }
            if(this.game.player.pos.distSq(this.pos) < 100){
                this.game.player.damage();
            }
        },
        render: function(){
            var r = this.main.renderer;
            if(this.damaged){
                this.damaged = false;
                r.color('white');
            }else{
                r.color('purple');
            }
            var radius = this.radius * 0.8;
            r.disc(0,0,5);
            r.circle(0,0,radius);
            r.circle(0,0,radius+2);
        },
    };

    /* -------- PROJECTILES --------- */

    function Projectile(pos,dir){
        this.main = null;
        this.game = null;
        this.pos  = V2(pos);
        this.dir  = dir;
        this.speed = this.dir.setLen(this.maxSpeed);
        this.destroyed = false;
    }

    Projectile.prototype = {
        maxSpeed: 950,
        lifetime: 1.0,
        wallDamage: 0.1,
        enemyDamage: 1,
        attack: function(enemy){
            enemy.damage(this.enemyDamage);
            this.destroyed = true;
        },
        damageWall:function(){
            var grid = this.game.world.grid;
            var cell = grid.getCellAtPixel(this.pos.x,this.pos.y); 
            if(cell){
                var value = -Math.max(0,Math.abs(cell.cell)-this.wallDamage); // flipped to indicate damage
                grid.setCell(cell.x,cell.y,value);
            }
        },
        update: function(){
            this.pos = this.pos.addScaled(this.speed,this.main.deltaTime);
            if(this.main.time > this.lifetime){
                this.destroyed = true;
            }else if( this.game.grid.collisionVector(  
                        this.pos.x-1,this.pos.y-1,
                        this.pos.x+1,this.pos.y+1   )){
                this.damageWall();
                this.destroyed = true;
            }
        },
        render: function(){
            var r = this.main.renderer;
            r.color('white');
            r.line( 0,0, - this.dir.x * 20,
                         - this.dir.y * 20 );
        },
    }

    function LaserProjectile(pos,dir){
        Projectile.call(this,pos,dir);
        this.length = 15 + Math.random()*20;
    }

    extend(LaserProjectile, Projectile, {
        maxSpeed: 950,
        lifetime: 3,
        wallDamage: 0.025,
        enemyDamage: 2,
        update: function(){
            if(this.main.time > this.lifetime){
                this.destroyed = true;
                return;
            }
            if(!this.stuck){
                this.pos = this.pos.addScaled(this.speed,this.main.deltaTime);
                if( this.game.grid.collisionVector(  
                            this.pos.x-1,this.pos.y-1,
                            this.pos.x+1,this.pos.y+1   )){
                    this.damageWall();
                    if(Math.random() < 0.05){
                        this.stuck = true;
                        this.lifetime += Math.random()*3;
                    }else{
                        this.destroyed = true;
                    }
                }
            }
        },
        render: function(){
            var r = this.main.renderer;
            var l = this.length;
            r.color('#FF00FF');
            r.line( this.dir.x * l,  this.dir.y * l,
                    -this.dir.x * l, -this.dir.y * l);
        },
    });

    function GruntProjectile(pos,dir){
        Projectile.call(this,pos,dir);
    }

    extend(GruntProjectile, Projectile, {
        maxSpeed: 150,
        lifetime: 5,
        wallDamage: 0.025,
        render: function(){
            var r = this.main.renderer;
            r.color('red');
            r.disc( 0,0,3);
        },
    });

    function SoldierProjectile(pos,dir){
        Projectile.call(this,pos,dir);
    }

    extend(SoldierProjectile, Projectile, {
        maxSpeed: 250,
        lifetime: 5,
        wallDamage: 1,
        render: function(){
            var r = this.main.renderer;
            r.color('green');
            r.disc( 0,0,4);
            r.circle( 0,0,6);
        },
    });

    /* -------- PLAYER WEAPONS --------- */

    function Weapon(options){
        this.player = options.player;
        this.main = options.player.main;
        this.game = options.player.main.scene;
        this.fireTime = 0;
    }

    Weapon.prototype = {
        fireInterval: 0.025,
        projectile: Projectile,
        fire: function(aim){
            if(this.main.time > this.fireTime){
                var spread = Math.max(0.02,Math.min(0.5, 0.5/(1+Math.max(0,-0.4+0.025*this.main.mouse().sub(this.player.pos).len()))))
                var dir = aim.add(V2.randomDisc().scale(spread)).normalize();
                this.game.addPlayerProj(new this.projectile(this.player.pos.add(dir.scale(10)),dir));
                this.fireTime = this.main.time + this.fireInterval;
            }
        }
    };

    function Lasers(options){
        Weapon.call(this,options);
        this.sequence = 0;
    }

    extend(Lasers, Weapon, {
        fireInterval: 0.025,
        projectile: LaserProjectile,
        fire: function(aim){
            if(this.main.time > this.fireTime){
                var spread = Math.max(0.02,Math.min(0.5, 0.5/(1+Math.max(0,-0.4+0.025*this.main.mouse().sub(this.player.pos).len()))))
                var dir = aim.add(V2.randomDisc().scale(spread)).normalize();
                this.game.addPlayerProj(new this.projectile(this.player.pos.add(dir.scale(10)),dir));
                this.fireTime = this.main.time + this.fireInterval;
                this.sequence++;
                if(this.sequence % 5 === 0){
                    var enemies = this.game.enemies;
                    var targets = [];
                    for(var i = 0, len = enemies.length; i < len; i++){
                        if(enemies[i].pos.distSq(this.player.pos) < 90000){
                            targets.push(enemies[i]);
                        }
                    }
                    var c = Math.min(5,targets.length);
                    var r = 5 - c;
                    while(c-- > 0){
                        var i = Math.floor(Math.random()*targets.length);
                        var target = targets.splice(Math.floor(Math.random()*targets.length),1)[0];
                        var dir = target.pos.sub(this.player.pos).addScaled(V2.randomDisc(),30).normalize();
                        this.game.addPlayerProj(new this.projectile(this.player.pos.add(dir.scale(10)),dir));
                    };
                    while(r-- > 0){
                        var dir = V2.randomDisc().normalize();
                        this.game.addPlayerProj(new this.projectile(this.player.pos.add(dir.scale(10)),dir));
                    }

                }
            }
        }
    });

    /* -------- PLAYER --------- */

    function Player(options){
        this.main  = options.main;
        this.game  = options.game;
        this.pos   = V2();
        this.cpos  = V2();
        this.speed = V2();
        this.maxSpeed = 150;
        this.fireInterval = 0.025;
        this.fireTime     = 0;
        this.radius = 10;
        this.weapons = {
            'default':new Weapon({player:this}),
            'lasers': new Lasers({player:this}),
        };
        this.weapon = this.weapons.default;
        this.wallDamage = 0.05;
    }

    Player.prototype = {
        damage: function(){
            this.game.restart();
        },
        damageCell: function(x,y,amount){
            var grid = this.game.world.grid;
            var cell = grid.getCell(x,y);
            if(cell){
                var value = -Math.max(0,Math.abs(cell)-amount); // flipped to indicate damage
                grid.setCell(x,y,value);
            }
        },
        damageWall:function(){
            var self = this;
            var grid = this.game.world.grid;
            var incx = (this.speed.x > 0) ? 1 : (this.speed.x < 0 ? -1 : 0) ;
            var incy = (this.speed.y > 0) ? 1 : (this.speed.y < 0 ? -1 : 0) ;
            var cell = grid.getCellAtPixel(this.pos.x, this.pos.y);
            var cells = []
            if(cell){
                if (Math.abs(incx)+Math.abs(incy) == 1){
                    this.damageCell(cell.x+incx,cell.y+incy,this.wallDamage);
                }
            }else if (Math.abs(incx)+Math.abs(incy) == 2){
                this.damageCell(cell.x+incx,cell.y,this.wallDamage/2);
                this.damageCell(cell.x,cell.y+incy,this.wallDamage/2);
                this.damageCell(cell.x+incx,cell.y+incy,this.wallDamage/3);
            }
        },
        setPos: function(pos){
            this.pos = pos.copy();
            this.cpos = pos.copy();
            this.main.pos = pos.copy();
        },
        update: function(){
            var input = this.main.input;


            if(input.down('d')){
                this.speed.x = this.maxSpeed;
            }else if(input.down('a')){
                this.speed.x = -this.maxSpeed;
            }else{
                this.speed.x = 0;
            }
            if(input.down('w')){
                this.speed.y = -this.maxSpeed;
            }else if(input.down('s')){
                this.speed.y = this.maxSpeed;
            }else{
                this.speed.y = 0;
            }

            this.pos = this.pos.addScaled(this.speed,this.main.deltaTime);

            if(this.speed.len()){
                var apos = this.pos.add(this.speed.setLen(400));
                this.cpos = this.cpos.lerp(apos,this.main.deltaTime*1.5);
            }

            var  collision = this.game.grid.collisionVector(
                                               this.pos.x - 10, this.pos.y - 10,
                                               this.pos.x + 10, this.pos.y + 10 );

            if(input.down('p')){
                this.main.exit();
            }

            this.aim = this.main.mouse().sub(this.pos).normalize();
            if(input.down('mouse0')){
                this.weapon.fire(this.aim);
                this.damageWall();
            }

            if(collision){
                this.pos = this.pos.add(collision);
            }
            
            var ccenter = this.cpos.lerp(this.main.mouse(),0.3) 
            var dist = this.main.pos.sub(ccenter);
            if  (dist.len() > 10){
                dist = dist.lerp(dist.scale(0.1),this.main.deltaTime);
                this.main.pos = ccenter.add(dist);
            }

        },
        render: function(){
            var r = this.main.renderer;
            r.color('blue');
            r.circle(0,0,this.radius);
            r.line(this.aim.x*3,this.aim.y*3,this.aim.x*18,this.aim.y*18);

        },
    }

    function World(options){
        this.cellSize  = 25;
        this.size     = 1000;
        this.roomSize = 25;
        this.grid     = new Grid2(this.size,this.size, {cellSizeX: this.cellSize, cellSizeY: this.cellSize});
        this.rooms    = new Grid2(this.size/this.roomSize, this.size/this.roomSize,
                                  {cellSizeX:this.roomSize*this.cellSize, cellSizeY: this.roomSize*this.cellSize});
    }

    World.prototype = {
        roomtypes: ['empty','garbage','dense'],
        generate: function(){
            var self = this;
            function randroom(){
                return self.roomtypes[Math.floor(Math.random()*self.roomtypes.length)];
            }
            this.grid.fill(0);
            this.rooms.each(function(x,y,cell){
                var roomtype = randroom();
                var rs = self.roomSize;
                self.rooms.setCell(x,y,{type:roomtype});
                self.genroom(roomtype,self.grid.rect(x*rs,y*rs,x*rs+rs-1,y*rs+rs-1));
            });
            return this;
        },
        genroom: function(type,cells){
            switch(type){
                case 'empty':
                    for(var i = 0; i < cells.length; i++){
                        this.grid.setCell(cells[i].x,cells[i].y, Math.random() < 0.05 ? 1 : 0);
                    }
                    break;
                case 'garbage':
                    for(var i = 0; i < cells.length; i++){
                        this.grid.setCell(cells[i].x,cells[i].y, Math.random() < 0.15 ? 1 : 0);
                    }
                    break;
                case 'dense':
                    for(var i = 0; i < cells.length; i++){
                        this.grid.setCell(cells[i].x,cells[i].y, Math.random() < 0.5 ? 1 : 0);
                    }
                    for(var i = 0; i < cells.length; i++){
                        if(Math.random() < 0.01){
                            this.genline(cells[i].x,cells[i].y,5,25,Math.random()<0.5?'x':'y');
                        }
                    }
                    break;
            }
        },
        genline: function(x,y,minlen,maxlen,dir){
            var len = minlen + Math.floor(Math.random()*(maxlen-minlen+1));
            var incx = dir === 'x' ? 1 : 0;
            var incy = 1-incx;
            var px   = x -Math.floor(len*incx/2.0)
            var py   = y -Math.floor(len*incy/2.0)
            while(len--){
                this.grid.setCell(px,py,0);
                px+= incx;
                py+= incy;
            }
        },
    };

    function Game(options){}
    Game.prototype = {
        start:  function(){
            var  self = this;
            this.mustrestart = false;
            this.player = new Player({game: this, main:this.main});
            this.playerProj = [];
            this.enemies = [];
            this.enemyProj = [];

            this.world  = new World().generate();
            this.grid   = this.world.grid;
            //this.grid.each(function(x,y,cell){ self.grid.setCell(x,y,Math.random()<0.1 ? 1 : 0)});
            this.player.setPos(V2(this.grid.totalSizeX/2,this.grid.totalSizeY/2));

            this.enemyfreq  = 1/40;
            this.enemycount = 0;
        },
        restart: function(){
            this.mustrestart = true;
        },
        addPlayerProj: function(proj){
            proj.main = this.main;
            proj.game = this;
            proj.lifetime += this.main.time;
            this.playerProj.push(proj);
        },
        addEnemyProj: function(proj){
            proj.main = this.main;
            proj.game = this;
            proj.lifetime += this.main.time;
            this.enemyProj.push(proj);
        },
        addEnemy: function(enemy){
            enemy.main = this.main;
            enemy.game = this;
            this.enemies.push(enemy);
        },
        update: function(){

            function clearDestroyed(list){
                var i = 0;
                while(i < list.length){
                    if(list[i].destroyed){
                        list.splice(i,1);
                    }else{
                        i++;
                    }
                }
            }
            
            if(Math.random() < this.enemyfreq){
                if(Math.random() < 0.1){
                    this.addEnemy(new Soldier({pos:this.player.pos.add(V2.randomDisc().scale(1000))}));
                }else if(Math.random() < 0.2){
                    this.addEnemy(new Grunt({pos:this.player.pos.add(V2.randomDisc().scale(1000))}));
                }else{
                    this.addEnemy(new Kamikaze({pos:this.player.pos.add(V2.randomDisc().scale(1000))}));
                }
                
                this.enemycount++;
                if(!(this.enemycount % 10)){
                    this.enemyfreq += 0.1 / this.enemycount;
                }
            }
            this.player.update();
            for(var i = 0, len = this.enemies.length; i < len; i++){
                this.enemies[i].update();
            }
            for(var i = 0, len = this.playerProj.length; i < len; i++){
                var proj = this.playerProj[i];
                    proj.update();
                for(var j = 0, jlen = this.enemies.length; j < jlen; j++){
                    var enemy = this.enemies[j];
                    if(proj.pos.distSq(enemy.pos) <= enemy.sqRadius){
                        proj.attack(enemy);
                    }
                }
            }
            var pr = this.player.radius * this.player.radius;
            for(var i = 0, len = this.enemyProj.length; i < len; i++){
                var proj = this.enemyProj[i];
                    proj.update();
                if(proj.pos.distSq(this.player.pos) <= pr){
                    proj.attack(this.player);
                }
            }
            clearDestroyed(this.enemies);

            this.render();
            clearDestroyed(this.playerProj);
            clearDestroyed(this.enemyProj);
            if(this.mustrestart){
                this.start();
            }
        },
        render: function(){
            var self = this;
            var ctx  = this.main.context;
            var r    = this.main.renderer;
            r.color('red');
            r.line(0,0,20,0);
            r.line(0,0,0,20);

            r.color('blue');
            var mouse = this.main.mouse();
            r.line(mouse.x-10,mouse.y-10,mouse.x+10,mouse.y+10);
            r.line(mouse.x+10,mouse.y-10,mouse.x-10,mouse.y+10);

            function renderEntity(entity){
                ctx.save();
                ctx.translate(entity.pos.x,entity.pos.y);
                entity.render();
                ctx.restore();
            }
            renderEntity(this.player);
            for(var i = 0, len = this.enemyProj.length; i < len; i++){
                renderEntity(this.enemyProj[i]);
            }
            for(var i = 0, len = this.playerProj.length; i < len; i++){
                renderEntity(this.playerProj[i]);
            }
            for(var i = 0, len = this.enemies.length; i < len; i++){
                renderEntity(this.enemies[i]);
            }

            var cs = this.world.cellSize;
            this.world.grid.pixelRect(this.main.pos.x - this.main.width/2,
                                this.main.pos.y - this.main.height/2,
                                this.main.pos.x + this.main.width/2,
                                this.main.pos.y + this.main.height/2,
                                function(x,y,cell){
                if(cell){
                    if(cell < 0){
                        if(cell < -0.75){
                            r.color('#555');
                        }else if(cell < -0.5){
                            r.color('#666');
                        }else if(cell < -0.25){
                            r.color('#777');
                        }else{
                            r.color('#aaa');
                        }
                        self.world.grid.setCell(x,y,-cell);
                    }else if(cell < 0.5){
                        r.color('#2b2b2b');
                    }else{
                        r.color('#333');
                    }
                    ctx.fillRect(x*cs, y*cs,cs,cs)
                }
            });

        },
    };

    document.addEventListener('DOMContentLoaded',function(){
        window.main = new Main({
            canvas: document.getElementById('game_canvas'),
            input:  new Input(), 
            scene:  new Game()});
        window.main.start();
    });

})(exports);

},{"./modula/Grid2.js":2,"./modula/Input.js":3,"./modula/Rect.js":5,"./modula/Transform2.js":6,"./modula/V2.js":7}],2:[function(require,module,exports){


/* ------ 2D Grids ----- */

(function(modula){

    /*
     * Grid2 represents a 2D Grid that can be used for physics,
     * pathtracing, raytracing, etc. Grid2 lets you put whatever you
     * want in the cells and doesn't modify them behind your back.
     *
     * sizeX: int > 0, the number of cells in the X axis
     * sizeY: int > 0, the number of cells in the Y axis
     * args : [optional] {
     *   cellSizeX : float > 0 : default 1.0: the size of a cell on the X axis
     *   cellSizeY : float > 0 : default 1.0: the size of a cell on the Y axis
     *   isSolid: function(x,y) -> bool : a function that returns true if 
     *            a cell is solid. (used for pathfinding & collisions)
     *            by default, 'truthy' cells are considered solid
     *   dist:  function(x1,y1, x2,y2) -> Float : a function that computes
     *          the distance between two cells. Grid2.distComposite(..) is 
     *          the default.
     *   neighbors: function(x,y) -> [{x,y,cell},...] : a function that
     *          returns a list of the neighbors of cell x,y
     *   fill:  anything : all cells will contain this.
     *   cells: Array[sizeX*sizeY], the cells of the grid, linearized: 
     *          X rows are put one after another by increasing Y
     *          this settings overrides 'fill'
     */

    function Grid2(sizeX,sizeY,args){
        args = args || {};
        this.sizeX = sizeX || 1;
        this.sizeY = sizeY || 1;
        this.cellSizeX = args.cellSizeX || 1.0;
        this.cellSizeY = args.cellSizeY || 1.0;
        this.cells = args.cells || [];
        this.totalSizeX = this.sizeX * this.cellSizeX;
        this.totalSizeY = this.sizeY * this.cellSizeY;
        if(typeof args.isSolid === 'function' && args.isSolid !== Grid2.prototype.isSolid){
            this.isSolid = args.isSolid;
        }
        if(typeof args.dist === 'function' && args.dist !== Grid2.prototype.distComposite){
            this.dist = args.dist;
        }
        if(typeof args.neighbors === 'function' && args.neighbors !== Grid2.prototype.neighbors){
            this.neighbors = args.neighbors;
        }
        if(typeof args.fill !== 'undefined' && !args.cells){
            this.fill(args.fill);
        }
    }

    modula.Grid2 = Grid2;

    var proto = Grid2.prototype;

    // returns the cell at grid coordinates x,y.
    // it will happilly return wrong results if x,y are outside the grid
    proto.getCellUnsafe = function(x,y){
        return this.cells[y*this.sizeX+x];
    };

    // returns the cell at grid coordinates x,y or undefined if outside the grid
    proto.getCell = function(x,y){
        if( x >= 0 && y >= 0 && x < this.sizeX && y < this.sizeY){
            return this.cells[y*this.sizeX+x];
        }else{
            return undefined;
        }
    };
    
    // sets the cell at grid coordinates x,y
    proto.setCell = function(x,y,cell){
        if(x >= 0 && y >= 0 && x < this.sizeX && y < this.sizeY){
            this.cells[y*this.sizeX+x] = cell;
        }
    };


    // returns true if the cell at x,y is solid (an obstacle for pathfinding and grid collisions)
    // by default truthy cells are considered solid. This method can be overriden by the Grid2
    // constructor
    proto.isSolid = function(x,y){
        return !!this.getCell(x,y);
    };
    
    // returns the manathan distance between two cells (x1,y1), (x2,y2)
    proto.distManhattan = function(x1,y1,x2,y2){
        return Math.abs(x2-x1)*this.cellSizeX + Math.abs(y2 - y1)*this.cellSizeY;
    };
    
    // returns the eclidian distance between two cells (x1,y1), (x2,y2)
    proto.distEuclidian = function(x1,y1,x2,y2){
        var dx = (x2 - x1) * this.cellSizeX;  
        var dy = (y2 - y1) * this.cellSizeY; 
        return Math.sqrt(dx*dx + dy*dy);
    };
    
    // returns a composite distance between two cells (x1,y1), (x2,y2)
    // the composite computes a path between the two cells made of horizontal
    // and diagonal moves, with the distance between two diagonal cells
    // being 150% the distance between two horizontal cells.
    // This is the default distance as it generates the best pathfinding results
    proto.distComposite = function(x1,y1,x2,y2){
        var dx = Math.abs(x2 - x1) * this.cellSizeX;
        var dy = Math.abs(y2 - y1) * this.cellSizeY; 
        var rect = Math.abs(dx-dy);
        var diag = Math.min(dx,dy);
        return rect + 1.5 * diag;
    };


    // returns the distance between two cells (x1,y1), (x2,y2) using the grid's
    // specific distance metric. default is distComposite
    proto.dist = function(x1,y1,x2,y2){
        return this.distComposite(x1,y1,x2,y2);
    };

    // returns a new Grid2 instance with the same cells and properties as this.
    proto.clone = function(){
        return new modula.Grid2(this.sizeX,this.sizeY, {
            cellSizeX: this.cellSizeX,
            cellSizeY: this.cellSizeY,
            cells: this.cells.slice(0),
            isSolid: this.isSolid,
            dist: this.dist,
            neighbors: this.neighbors,
        });
    }

    // sets every cell in the grid to 'cell'
    proto.fill = function(cell){
        var len = this.sizeX * this.sizeY;
        if(this.cells.length === len){
            for(var i = 0; i < len; i++){
                this.cells[i] = cell;
            }
        }else{
            this.cells = [];
            while(len--){
                this.cells.push(cell);
            }
        }
    };

    // returns the cell {x,y,cell} that contains the pixel coordinate (px,py)
    proto.getCellAtPixel = function(px,py){
        if(px < 0 || px >= this.totalSizeX || py < 0 || py >= this.totalSizeY){
            return undefined;
        }else{
            var x = Math.max(0,Math.min(this.sizeX-1, Math.floor(px/this.cellSizeX)));
            var y = Math.max(0,Math.min(this.sizeY-1, Math.floor(py/this.cellSizeY)));
            return { x:x, y:y, cell:this.getCellUnsafe(x,y) };
        }
    };

    // returns true if the cell x,y is inside this grid
    proto.cellInside = function(x,y){
        return x >= 0 && x < this.sizeX && y >= 0 && y < this.sizeY;
    };

    // returns true if there is a cell in the grid containing the pixel
    proto.pixelInside = function(x,y){
        return x >= 0 && x < this.sizeX * this.cellSizeX && y >= 0 && y < this.sizeY * this.cellSizeY;
    };

    // iterates over each cell of the grid by calling the iterator function
    // iterator(x,y,cell) for each cell
    proto.each = function(iterator){
        var x = 0, y = 0, i = 0, len = this.sizeX * this.sizeY;
        while(i < len){
            iterator(x,y,this.cells[i]);
            if(++x >= this.sizeX){
                x = 0;
                y++;
            }
            i++;
        }
    };
    
    // iterates over each cell of the grid until the iterator function
    // iterator(x,y,cell) -> bool returns true, then returns the corresponding
    // cell and coordinates : {x,y,cell}
    proto.find = function(iterator){
        var x = 0, y = 0, i = 0, len = this.sizeX * this.sizeY;
        while(i < len){
            if(iterator(x,y,this.cells[i])){
                return {x:x, y:y, cell:this.cells[i]};
            }
            if(++x >= this.sizeX){
                x = 0;
                y++;
            }
            i++;
        }
        return undefined;
    };

    // iterates over each cell of the grid, replacing the existing cell by
    // the return value of the iterator function iterator(x,y,cell) -> cell
    proto.map = function(iterator){
        var x = 0, y = 0, i = 0, len = this.sizeX * this.sizeY;
        while(i < len){
            this.cells[i] = iterator(x,y,this.cells[i]);
            if(++x >= this.sizeX){
                x = 0;
                y++;
            }
            i++;
        }
    };

    // iterates over each cell contained in the rectangular region cell
    // [ minx, miny ] [maxx, maxy] (inclusive), by calling the (optional)
    // iterator function iterator(x,y,cell), and then returning the cells 
    // {x,y,cell} as a list
    proto.rect = function(minx, miny, maxx, maxy, iterator){
        if(maxx < 0 || maxy < 0 || minx > this.sizeX || miny >= this.sizeY){
            return [];
        }else{
            var cells = [];
            minx = Math.max(0,minx);
            miny = Math.max(0,miny);
            maxx = Math.min(this.sizeX-1, maxx);
            maxy = Math.min(this.sizeY-1, maxy);
            for(var x = minx; x <= maxx; x++){
                for(var y = miny; y <= maxy; y++){
                    var cell = this.getCellUnsafe(x,y);
                    cells.push({x:x, y:y, cell: cell});
                    if(iterator){
                        iterator.call(this,x,y,cell);
                    }
                }
            }
            return cells;
        }
    };
    
    // iterates over each cell overlapping the rectangular region determined
    // by the inclusive pixel coordinate [ minx, miny ] [maxx, maxy] by 
    // calling the (optional) iterator function iterator(x,y,cell), and 
    // then returning the cells {x,y,cell} as a list
    proto.pixelRect = function(minx, miny, maxx, maxy, iterator){
        var totalSizeX = this.sizeX * this.cellSizeX;
        var totalSizeY = this.sizeY * this.cellSizeY;
        if(maxx <= 0 || maxy <= 0){
            return [];
        }else if(minx >= totalSizeX || miny >= totalSizeY){
            return [];
        }else{
            var csizex  = 1.0 / this.cellSizeX;
            var csizey = 1.0 / this.cellSizeY;
            minx = Math.floor(Math.max(minx,0) * csizex);
            miny = Math.floor(Math.max(miny,0) * csizey);
            maxx = Math.floor(Math.min(maxx,totalSizeX-1) * csizex);
            maxy = Math.floor(Math.min(maxy,totalSizeY-1) * csizey);
            var cells = [];
            for(var x = minx; x <= maxx; x++){
                for(var y = miny; y <= maxy; y++){
                    var cell = this.getCellUnsafe(x,y);
                    cells.push({x:x, y:y, cell: cell});
                    if(iterator){
                        iterator.call(this,x,y,cell);
                    }
                }
            }
            return cells;
        }
    };

    // iterates over each cell at a distance smaller or equal to r from 
    // the cell (cx,cy)  by calling the (optional) iterator function 
    // iterator(x,y,cell), and then returning the cells 
    // {x,y,cell} as a list
    proto.circle = function(cx,cy,r,opts,iterator){
        var self  = this;
        var cells = [];
        if( typeof opts === 'function' ){
            iterator = opts;
            opts = {};
        }else{
            opts = opts || {};
        }

        var dist = opts.dist 
                 ? function(){ return opts.dist.apply(self,arguments); }
                 : function(){ return self.dist.apply(self,arguments); }

        var rx = Math.ceil(r / this.cellSizeX);
        var ry = Math.ceil(r / this.cellSizeY);
        this.rect(cx-rx,cy-ry,cx+rx,cy+ry,function(x,y,cell){
            if(dist(cx,cy,x,y) <= r){
                cells.push({x:x,y:y,cell:cell});
                if(iterator){
                    iterator.call(this,x,y,cell);
                }
            }
        });
        return cells;
    };

    proto._neighbors = function _neighbors(x,y){
        var n = [];
        if( x < -1 || x > this.sizeX || y < -1 || y > this.sizeY){
            return [];
        }else{
            var minX = Math.max(0,x-1);
            var maxX = Math.min(this.sizeX-1,x+1);
            var minY = Math.max(0,y-1);
            var maxY = Math.min(this.sizeY-1,y+1);
            for(var nx = minX; nx <= maxX; nx++){
                for(var ny = minY; ny <= maxY; ny++){
                    if(nx != x || ny !== y){
                        n.push({x:nx,y:ny});
                    }
                }
            }
            return n;
        }
    };

    proto._neighborsNoDiags = function(x,y){
        var n = [];
        if(y >= 0 && y < this.sizeY){
            if(x-1 >= 0){
                n.push({x:x-1, y:y});
            }
            if(x+1 < this.sizeX){
                n.push({x:x+1, y:y});
            }
        }
        if( x >= 0 && x < this.sizeX ){
            if(y-1 >= 0){
                n.push({x:x, y:y-1});
            }
            if(y+1 < this.sizeY){
                n.push({x:x, y:y+1});
            }
        }
        return n;
    };

    // returns the list of neighboring cells {x,y,cell} of cell (x,y)
    // if nodiags is true, diagonals neighbors are omitted
    proto.neighbors = function neighbors(x,y,nodiags){
        var n = nodiags ? this._neighborsNoDiags(x,y) : this._neighbors(x,y);
        for(var i = 0, len = n.length; i < len; i++){
            n.cell = this.getCellUnsafe(x,y);
        }
        return n;
    };


    /* --- Set Map and Heap for A* --- */

    function PointSet(grid){
        this.set = [];
        this.size = 0;
        this.grid = grid;
        this.sizeX = this.grid.sizeX;
        this.set[this.grid.sizeX * this.grid.sizeY] = null;
    }
    
    PointSet.prototype = {
        add: function add(point){
            var h = point.x + point.y * this.sizeX;
            if( !this.set[h] ){
                this.size++;
            }
            this.set[h] = point;
            return h;
        },
        remove: function remove(point){
            var h = point.x + point.y * this.sizeX;
            if(this.set[h]){
                this.set[h] = null;
                this.size--;
            }
        },
        contains: function contains(point){
            return !!this.set[point.x + point.y * this.sizeX];
        },
    };
    
    function PointMap(grid){
        this.grid = grid;
        this.sizeX = grid.sizeX;
        this.map = [];
        this.map[this.grid.sizeX * this.grid.sizeY] = null;
    }
    
    PointMap.prototype = {
        set: function set(point,value){
            this.map[ point.x + point.y * this.sizeX] = value;
        },
        get: function get(point){
            return this.map[ point.x + point.y * this.sizeX];
        }
    };

    function PointHeap(grid){
        this.content = [];
        this.set = new PointSet(grid);
    }
    
    PointHeap.prototype = {
        add: function add(point,dist){
            if(!this.set.contains(point)){
                this.set.add(point);
                this.content.push({dist:dist, point:point});
                this._bubbleUp(this.content.length - 1);
            }else{
                this.remove(point);
                this.content.push({dist:dist, point:point});
                this._bubbleUp(this.content.length - 1);
            }
        },
        popClosest: function popClosest(){
            var result = this.content[0];
            var end    = this.content.pop();
            if(this.content.length > 0){
                this.content[0] = end;
                this._sinkDown(0);
            }
            this.set.remove(result.point);
            return result;
        },
        size: function size(){
            return this.content.length;
        },
        contains: function contains(point){
            return this.set.contains(point);
        },
        remove: function(point){
            var len = this.content.length;
            for (var i = 0; i < len; i++){
                if(this.content[i].point.x !== point.x || this.content[i].point.y !== point.y){
                    continue;
                }
                var end = this.content.pop();
                if( i === length -1){
                    return end;
                }else{
                    this.content[i] = end;
                    this._bubbleUp(i);
                    this._sinkDown(i);
                    return end;
                }
            }
        },
        _bubbleUp: function _bubbleUp(n){
            var element = this.content[n];
            while( n > 0 ){
                var parentN = Math.floor((n + 1) / 2) - 1;
                var parent  = this.content[ parentN ];
                if(element.dist >= parent.dist){
                    break;
                }
                this.content[parentN] = element;
                this.content[n] = parent;
                n = parentN;
            }
        },
        _sinkDown: function _sinkDown(n){
            var element = this.content[n];
            var length  = this.content.length;
            while( true ){
                var child2N = ( n+1 ) * 2;
                var child1N = child2N - 1;
                var swap = null;

                if(child1N < length ){ 
                    var child1 = this.content[child1N];
                    if(child1.dist < element.dist ){
                        swap = child1N;
                    }
                }

                if(child2N < length) { 
                    var child2 = this.content[child2N];
                    if( child2.dist < ( swap === null ? element.dist : child1.dist ) ){
                        swap = child2N;
                    }
                }

                if(swap === null){
                    break;
                }
                this.content[n] = this.content[swap];
                this.content[swap] = element;
                n = swap;
            }
        },

    };
    

    function reconstruct_path(came_from, end){
        var path = [];
        var current = end;
        while(current){
            path.push(current);
            current = came_from.get(current);
        };
        return path.reverse();
    }
    
    // iterates over the cells creating the shortest past from (startX,startY)
    // to (endX,endY) by calling the (optional) iterator function 
    // iterator(x,y,cell), and then returning the path as list [{x,y,cell},..]
    // the follwing options can be provided:
    // opts: {
    //   dist: a custom distance function(x1,y1,x2,y2) -> float that computes 
    //         the distance between cells. This function is executed as a grid
    //         method and is used to compute the length of the path. If none is
    //         given the grid's dist method is used.
    //
    //   heuristic: a custom distance function(x1,y1,x2,y2) -> float that
    //         computes the A* heuristic. by default the grid's dist method is used.
    //         if the heuristic is not always smaller or equal than dist(), an
    //         optimal path is not guaranteed.
    //         
    //   neighbors : a function(x,y) that returns the list [{x,y},..] of 
    //               neighboring cells from cell (x,y) and is used to determine the
    //               allowed moves from one cell to the other in the path. 
    //
    //   nodiags: if true and the default neighbor method is used, then diagonals
    //            neighbors are ignored
    //
    //   isSolid: a function(x,y) -> bool that returns true when the cell (x,y)
    //            should be excluded from the path. By default, the grid's isSolid
    //            method is used.

    proto.path = function path( startX, startY, endX, endY, opts, iterator){
        var self = this;
        if(typeof opts === 'function'){
            iterator = opts;
            opts = {};
        }else{
            opts = opts || {};
        }
        var result = [];

        var start = {x:startX, y:startY};
        var end   = {x:endX,   y:endY}; 
        var _dist = opts.dist || this.dist;
        var dist = function(start,end){
                return _dist.call(self, start.x,start.y, end.x,end.y);
            };
        var _heuristic = opts.heuristic || this.dist;
        var heuristic = function(start, end){
                return _heuristic.call(self,start.x, start.y, end.x, end.y);
            };

        var get_neighbors = opts.neighbors 
                          ? function(x,y){ return opts.neighbors.call(self,x,y); }
                          : ( opts.nodiags 
                            ? function(x,y){ return self._neighborsNoDiags(x,y);} 
                            : function(x,y){ return self._neighbors(x,y); }
                            );
        
        var is_solid = opts.isSolid
                     ? function(x,y) { return opts.isSolid.call(self,x,y); }
                     : function(x,y) { return self.isSolid(x,y); };

        var closedset = new PointSet(this);
        var openset   = new PointHeap(this);
            openset.add({x:startX, y:startY},0 + heuristic(start,end));
        var came_from = new PointMap(this);
        var g_score   = new PointMap(this);
            g_score.set(start,0);

        while( openset.size() > 0 ){
            var current = openset.popClosest().point; 

            if( current.x === endX && current.y === endY){
                result = reconstruct_path(came_from, end);
                break;
            }

            closedset.add(current); 

            var neighbors = get_neighbors(current.x, current.y); //get_neighbors.call(this,current.x,current.y);
            for(var i = 0, len = neighbors.length; i < len; i++){
                var neighbor = neighbors[i];
                
                if(this.isSolid(neighbor.x, neighbor.y) || closedset.contains(neighbor)){
                    continue;
                }

                var tentative_g_score = g_score.get(current) + dist(current,neighbor);

                if( !openset.contains(neighbor) || tentative_g_score < g_score.get(neighbor) ){
                    came_from.set(neighbor, current);
                    g_score.set(neighbor, tentative_g_score);
                    openset.add(neighbor, tentative_g_score + heuristic(neighbor, end));
                }
            }
        }
        if(iterator){
            for(var i = 0, len = result.length; i < len; i++){
                var r = result[i]
                    r.cell = this.getCellUnsafe(r.x,r.y);
                iterator.call(this,r.x,r.y,r.cell,i,len);
            }
        }
        return result;
    };

    // returns the pixel coordinates {x,y} of the first intersection
    // of the ray starting at pixel (Ox,Oy) in the direction (Rx,Ry) 
    // with the axis aligned box of size (bsx,bsy) pixels, with the
    // corner with the smallest pixel coordinates (bx,by)
    // 
    // The ray can intersect the box from the inside.
    // If no intersection is found, it returns undefined

    function rayIntersectBox(Ox,Oy,Rx,Ry,bx,by,bsx, bsy){
        // http://www.scratchapixel.com/lessons/3d-basic-lessons/lesson-7-intersecting-simple-shapes/ray-box-intersection/
        var minx = bx;
        var miny = by;
        var maxx = bx+bsx;
        var maxy = by+bsy;
        var iRx = 1.0/Rx;
        var iRy = 1.0/Ry;

        if( iRx >= 0 ){
            var tminx = ( minx - Ox) * iRx;
            var tmaxx = ( maxx - Ox) * iRx;
        }else{
            var tminx = ( maxx - Ox) * iRx;
            var tmaxx = ( minx - Ox) * iRx;
        }
        if( iRy >= 0 ){
            var tminy = ( miny - Oy) * iRy;
            var tmaxy = ( maxy - Oy) * iRy;
        }else{
            var tminy = ( maxy - Oy) * iRy;
            var tmaxy = ( miny - Oy) * iRy;
        }
        if( tminx > tmaxy || tminy > tmaxx ){
            return undefined;
        }
        var tmin  = (tminy > tminx || tminx !== tminx) ? tminy : tminx; //Math.max(tminx,tminy);
        var tmax  = (tmaxy < tmaxx || tmaxx !== tmaxx) ? tmaxy : tmaxx; //Math.min(tmaxx,tmaxy);
        if( tmax <= 0 ){
            return undefined;
        }else if( tmin <= 0){
            return {x: Ox+tmax*Rx, y:Oy+tmax*Ry};
        }else{
            return {x: Ox+tmin*Rx, y:Oy+tmin*Ry};
        }
    }

    // returns the pixel coordinates {x,y} of the first intersection
    // of the ray starting at pixel (startX,startY) in the direction 
    // (dirX,dirY) with the boundaries of the cell (cellX,cellY)
    //
    // - The ray can intersect the box from the inside.
    // - If no intersection is found, it returns undefined

    proto.rayIntersectCell = function(startX,startY,dirX,dirY,cellX,cellY){
        return rayIntersectBox(startX,startY,dirX,dirY,cellX*this.cellSizeX,cellY*this.cellSizeY,this.cellSizeX,this.cellSizeY);
    }

    // iterates over the grid's cells containing the ray starting at
    // pixel (startX,starty) in the direction (dirX,dirY) in the order
    // of intersection, by calling the iterator function 
    //    iterator(x,y,cell, inX,inY, outX,outY) -> bool
    // stopping when it returns true.
    // (inX,inY), (outX,outY) are the pixel coordinates of the entry and exit
    // points of the ray in the cell.
    //
    // - start position may lie outside the grid.
    proto.raytrace = function(startX, startY, dirX, dirY, iterator){
        
        // http://www.xnawiki.com/index.php?title=Voxel_traversal

        if(!this.pixelInside(startX,startY)){
            start = rayIntersectBox(startX,startY,dirX,dirY,0,0,this.cellSizeX*this.sizeX, this.cellSizeY*this.sizeY);
            if(!start){
                return;
            }
            startX = start.x;
            startY = start.y;
        }

        var Rx = dirX / this.cellSizeX;
        var Ry = dirY / this.cellSizeY;
        var iRx = 1.0 / Rx;
        var iRy = 1.0 / Ry;
        var X  = Math.floor(startX);
            X  = X >= this.sizeX ? this.sizeX - 1 : X;
        var Y  = Math.floor(startY);
            Y  = Y >= this.sizeY ? this.sizeY - 1 : Y;
        var stepX = Rx === 0 ? 1 : (Rx > 0 ? 1: -1);
        var stepY = Ry === 0 ? 1 : (Ry > 0 ? 1: -1);
        var boundX = X + (stepX > 0 ? 1 : 0);
        var boundY = Y + (stepY > 0 ? 1 : 0);
        var tmaxX = (boundX - startX) * iRx ;
            tmaxX = (tmaxX !== tmaxX) ? Number.POSITIVE_INFINITY : tmaxX;
        var tmaxY = (boundY - startY) * iRy;
            tmaxY = (tmaxY !== tmaxY) ? Number.POSITIVE_INFINITY : tmaxY;
        var tdeltaX  = stepX * iRx;
            tdeltaX  = (tdeltaX !== tdeltaX) ? Number.POSITIVE_INFINITY : tdeltaX;
        var tdeltaY  = stepY * iRy;
            tdeltaY  = (tdeltaY !== tdeltaY) ? Number.POSITIVE_INFINITY : tdeltaY;
        var currX = startX;
        var currY = startY;
        var nextX = startX;
        var nextY = startY;
        do{
            var cX = X;
            var cY = Y;
            if (tmaxX < tmaxY){
                X += stepX;
                nextX  = startX + tmaxX * dirX;
                tmaxX += tdeltaX;
            }else if(tmaxX > tmaxY){
                Y += stepY;
                nextY  = startX + tmaxY * dirY;
                tmaxY += tdeltaY;
            }else{
                X += stepX;
                Y += stepY;
                nextX  = startX + tmaxX * dirX;
                nextY  = startX + tmaxY * dirY;
                tmaxX += tdeltaX;
                tmaxY += tdeltaY;
            }
            if(iterator.call(this, cX,cY, this.getCellUnsafe(cX,cY), currX, currY, nextX, nextY)){
                break;
            }
            currX = nextX;
            currY = nextY;
        }while(this.cellInside(X,Y));

    };

    // returns the shortest translation vector that can translate
    // the box with minimum pixel coordinates (minX,minY) and
    // maximum pixel coordinates (maxX,maxY) so that the box doesn't
    // collides with any solid cell.
    //
    // if no translation is needed, it returns undefined.
    //
    // the following options can be privided:
    // opts : {
    //   isSolid : function(x,y) -> bool : that returns true when cell
    //             (x,y) must be considered as solid. If not provided,
    //             the grid's isSolid method is used.
    // }
    proto.collisionVector =  function(minX,minY,maxX,maxY,opts){
        var self  = this;
            opts  = opts || {};

        var sx    = maxX - minX;
        var sy    = maxY - minY;
        var px    = minX + sx/2.0;
        var py    = minY + sy/2.0;
 
        var cx    = this.sizeX;
        var cy    = this.sizeY;
        var csx   = this.cellSizeX;
        var csy   = this.cellSizeY;

        if(maxX <= 0 || maxY <= 0 || minX >= cx*csx || minY >= cy*csy){
            return;
        }

        var is_solid  = opts.isSolid 
                      ? function(x,y){ return opts.solidity.call(this,x,y); }
                      : function(x,y){ return self.isSolid(x,y); };

        //we transform everything so that the cells are squares of size 1.

        var isx   = 1 / csx;
        var isy   = 1 / csy;

        minX *= isx;
        minY *= isy;
        maxX *= isx;
        maxY *= isy

        var min_px = Math.floor(minX);
        var max_px = Math.floor(maxX);
        var min_py = Math.floor(minY);
        var max_py = Math.floor(maxY);

        // these are the distances the entity should be displaced to escape
        // left blocks, right blocks, up ... 

        var esc_l = (min_px + 1 - minX) * csx;
        var esc_r = -( maxX - max_px )  * csx;  
        var esc_u = (min_py + 1 - minY) * csy;
        var esc_d = -( maxY - max_py )  * csy;


        // at this point we are back in world sizes 

        if(min_px === max_px && min_py === max_py){
            // in the middle of one block
            if(is_solid(min_px,min_py)){
                var dx = esc_l < -esc_r ? esc_l : esc_r;
                var dy = esc_u < -esc_d ? esc_u : esc_d;
                if(Math.abs(dx) < Math.abs(dy)){
                    return {x:dx, y:0};
                }else{
                    return {x:0, y:dy};
                }
            }else{
                return undefined;
            }
        }else if(min_px === max_px){
            // in the middle of one vertical two-block rectangle
            var solid_u = is_solid(min_px,min_py);
            var solid_d = is_solid(min_px,max_py);
            if(solid_u && solid_d){
                return undefined; // error
            }else if(solid_u){
                return {x:0, y:esc_u};
            }else if(solid_d){
                return {x:0, y:esc_d};
            }else{
                return undefined;
            }
        }else if(min_py === max_py){
            // in the middle of one horizontal two-block rectangle
            var solid_l = is_solid(min_px,min_py);
            var solid_r = is_solid(max_px,min_py);
            if(solid_l && solid_r){
                return undefined; // error
            }else if(solid_l){
                return {x:esc_l, y:0};
            }else if(solid_r){
                return {x:esc_r, y:0};
            }else{
                return undefined;
            }
        }else{
            // touching four blocks
            var solid_ul = is_solid(min_px,min_py);
            var solid_ur = is_solid(max_px,min_py);
            var solid_dl = is_solid(min_px,max_py);
            var solid_dr = is_solid(max_px,max_py);
            var count = 0 + solid_ul + solid_ur + solid_dl + solid_dr;
            if(count === 0){
                return undefined;
            }else if(count === 4){
                var dx = 0, dy = 0;
                if( -esc_r < esc_l){
                    dx = esc_r - csx;
                }else{
                    dx = esc_l + csx;
                }
                if( -esc_d < esc_u){
                    dy = esc_d - csx;
                }else{
                    dy = esc_u + csx;
                }
                if(Math.abs(dx) < Math.abs(dy)){
                    return {x:dx,y:0};
                }else{
                    return {x:0, y:dy};
                }
            }else if(count >= 2){
                var dx = 0;
                var dy = 0;
                if(solid_ul && solid_ur){
                    dy = esc_u;
                }
                if(solid_dl && solid_dr){
                    dy = esc_d;
                }
                if(solid_dl && solid_ul){
                    dx = esc_l;
                }
                if(solid_dr && solid_ur){
                    dx = esc_r;
                }
                if(count === 2){
                    // center of the bound relative to the center of the 4
                    // cells. cy goes up
                    var sx = esc_l - esc_r;
                    var sy = esc_u - esc_d;
                    var cx = -esc_r - sx*0.5;
                    var cy = -(-esc_d - sy*0.5);

                    if(solid_dr && solid_ul){
                        // XXXX
                        // XXXX
                        //     XXXX
                        //     XXXX
                        if(cy >= -cx){
                            dx = esc_l;
                            dy = esc_d;
                        }else{
                            dx = esc_r;
                            dy = esc_u;
                        }
                    }else if(solid_dl && solid_ur){
                        //     XXXX
                        //     XXXX
                        // XXXX 
                        // XXXX
                        if(cy >= cx){
                            dx = esc_r;
                            dy = esc_d;
                        }else{
                            dx = esc_l;
                            dy = esc_u;
                        }
                    }
                }
                return {x:dx, y:dy};
            }else{
                if(solid_dl){
                    return -esc_d < esc_l ?  {x:0, y:esc_d} : {x:esc_l, y:0};
                }else if(solid_dr){
                    return -esc_d < -esc_r ? {x:0, y:esc_d} : {x:esc_r, y:0};
                }else if(solid_ur){
                    return esc_u < -esc_r ?  {x:0, y:esc_u} : {x:esc_r, y:0};
                }else{
                    return esc_u < esc_l ?   {x:0, y:esc_u} : {x:esc_l, y:0};
                }
            }
        }
    };

    /*
    modula.$Grid2 = function $Grid2(selector,x,y,size){
        var  self = this;
        this.grid = new modula.Grid2(x,y,{
            cellSizeX:size,
            cellSizeY:size,
            isSolid: function(x,y){
                var cell = this.getCell(x,y);
                return cell && cell.hasClass('solid');
            }
        });
        this.grid.map(function(x,y){
            var $cell = $("<div class='cell'></div>");
            $cell.css({
                'float':  'left',
                'width':  size+'px',
                'height': size+'px',
                'text-align':'center',
                'font-size': size/4+'px',
                'line-height': size+'px',
                'color':'gray',
                'border': 'solid 1px gray',
                'box-sizing': 'border-box',
            });
            $cell.data('grid',self);
            $cell.data('x',x);
            $cell.data('y',y);
            $cell.appendTo(selector);
            $cell.click(function(){
                if( self.grid.isSolid(x,y) ){
                    self.setVoid(x,y);
                }else{
                    self.setSolid(x,y);
                }
            });
            $cell.setVoid = function(){ self.setVoid(x,y); };
            $cell.setSolid = function(){ self.setSolid(x,y); };

            return $cell;
        });
        $(selector).css({
            'overflow':'hidden',
            'width': this.grid.totalSizeX + 'px',
            'height': this.grid.totalSizeY + 'py',
        });
        this.setSolid = function(x,y){
            this.grid.getCell(x,y).addClass('solid').css({'background':'black'});
        };
        this.setVoid = function(x,y){
            this.grid.getCell(x,y).removeClass('solid').css({'background':'white'});
        };
    };*/

})(typeof exports === 'undefined' ? ( this['modula'] || (this['modula'] = {})) : exports );






},{}],3:[function(require,module,exports){

/* ------ Input Handling ----- */

(function(modula){

    var V2    = require('./V2.js').V2;
    
    function Input(){
        var  self = this;

        this.status   = {}; // 'up' 'press' 'down' 'release' 'pressrelease'
        this.events   = [];
        this.node     = document.body; 
        this.newPos   = V2();
        this.pos      = V2();
        this.deltaPos = V2();

        this.handlerKeyup = function(event){
            self.events.push({type:'up', key: String.fromCharCode(event.which).toLowerCase()});
        };
        this.handlerKeydown = function(event){
            self.events.push({type:'down', key: String.fromCharCode(event.which).toLowerCase()});
        };
        this.handlerMouseup = function(event){
            self.events.push({type:'up', key: 'mouse'+event.button}); 
        };
        this.handlerMousedown = function(event){
            self.events.push({type:'down', key: 'mouse'+event.button}); 
        };

        function position(node,event){
            var offsetX = 0;
            var offsetY = 0;

            do{
                offsetX += node.offsetLeft;
                offsetY += node.offsetTop;
            }while((node = node.offsetParent));
            
            return V2(event.pageX - offsetX, event.pageY - offsetY);
        }

        this.handlerMousemove = function(event){
            self.newPos = position(this,event);
        };

        this.node.addEventListener('keyup',this.handlerKeyup);
        this.node.addEventListener('keydown',this.handlerKeydown);
        this.node.addEventListener('mouseup',this.handlerMouseup);
        this.node.addEventListener('mousedown',this.handlerMousedown);
        this.node.addEventListener('mousemove',this.handlerMousemove);
    }

    Input.prototype = {
        update: function(){

            var transition = {
                'up':'up',
                'down':'down',
                'press':'down',
                'release':'up',
                'releasepress':'down',
                'pressrelease':'up',
            };

            for(key in this.status){
                var previous = this.status[key] || 'up';
                this.status[key] = transition[previous];
            }

            var uptransition = {
                'up' :   'up',
                'down' : 'release',
                'press': 'pressrelease',
                'release':'release',
                'releasepress':'pressrelease',
                'pressrelease':'pressrelease',
            };
            
            var downtransition = {
                'up':    'press',
                'down':  'down',
                'press': 'press',
                'release':'releasepress',
                'releasepress':'releasepress',
                'pressrelease':'releasepress',
            };


            for(var i = 0, len = this.events.length; i < len; i++){
                var e = this.events[i];
                var previous = this.status[e.key] || 'up';
                if(e.type === 'up'){
                    this.status[e.key] = uptransition[this.status[e.key] || 'up'];
                }else{ 
                    this.status[e.key] = downtransition[this.status[e.key] || 'up'];
                }
            }
            this.events = [];

            this.deltaPos = this.newPos.sub(this.pos);
            this.pos = this.newPos;

        },
        pressed: function(key){
            var status = this.status[key] || 'up';
            return status === 'press' || status === 'pressrelease' || status === 'releasepress';
         },
        down: function(key){
            var status = this.status[key] || 'up';
            return status === 'down' || status === 'press' || status === 'pressrelease';
        },
        released: function(key){
            var status = this.status[key] || 'up';
            return status === 'release' || status === 'pressrelease' || status === 'releasepress';
        },
        up: function(key){
            var status = this.status[key] || 'up';
            return status === 'up' || status === 'release' || status === 'releasepress';
        },
    };

    modula.Input = Input;
})(typeof exports === 'undefined' ? ( this['modula'] || (this['modula'] = {})) : exports );

},{"./V2.js":7}],4:[function(require,module,exports){

/* ------ 3x3 Matrix for 2D Transformations ----- */

(function(modula){

    var V2 = modula.V2 || (typeof 'require' !== 'undefined' ? require('./V2.js').V2 : null);

    if(!V2 ){
        throw new Error('modula.Mat3 requires modula.V2');
    }

        
    // 0 3 6 | xx xy xz
    // 1 4 7 | yx yy yz
    // 2 5 8 | zx zy zz
    
    var setArray = function(md,array,offset){
        offset = offset || 0;
        md.xx = array[offset];
        md.xy = array[offset + 3];
        md.xz = array[offset + 6];
        md.yx = array[offset + 1];
        md.yy = array[offset + 4];
        md.yz = array[offset + 7];
        md.zx = array[offset + 2];
        md.zy = array[offset + 5];
        md.zz = array[offset + 8];
        return md;
    };

    var set = function(md,components_){
        setArray(md,arguments,1);
        return md;
    };

    function Mat3(){
        var self = this;
        if(this.constructor !== Mat3){
            self = new Mat3();
        }
        var alen = arguments.length;
        if(alen === 0){
            self.xx = 1;
            self.xy = 0;
            self.xz = 0;
            self.yx = 0;
            self.yy = 1;
            self.yz = 0;
            self.zx = 0;
            self.zy = 0;
            self.zz = 1;
        }else if (alen === 1){
            var arg = arguments[0];
            if( typeof arg === 'string'){
                arg = JSON.parse(arg);
            }
            if(arg[0] !== undefined){
                setArray(self,arg);
            }else if(   typeof arg.rotate === 'number'
                     || typeof arg.scale === 'number'
                     || typeof arg.translate === 'number'){
                Mat3.setTransform(self,
                        arg.translate || new V2(),
                        arg.scale|| new V2(1,1),
                        arg.rotate || 0
                );
            }else{
                self.xx = arg.xx || 0;
                self.xy = arg.xy || 0;
                self.xz = arg.xz || 0;
                self.yx = arg.yx || 0;
                self.yy = arg.yy || 0;
                self.yz = arg.yz || 0;
                self.zx = arg.zx || 0;
                self.zy = arg.zy || 0;
                self.zz = arg.zz || 0;
            }
        }else if (alen === 9){
            setArray(self,arguments);
        }else{
            throw new Error('wrong number of arguments:'+alen);
        }
        return self;
    };

    modula.Mat3 = Mat3;

    Mat3.id       = new Mat3();
    Mat3.zero     = new Mat3(0,0,0,0,0,0,0,0,0);
    Mat3.tmp      = new Mat3();
    Mat3.tmp1     = new Mat3();
    Mat3.tmp2     = new Mat3();

    var tmp = new Mat3();

    var proto = Mat3.prototype;

    var epsilon = 0.00000001;

    function epsilonEquals(a,b){  return Math.abs(a-b) <= epsilon };

    Mat3.equals  = function(m,n){
        return epsilonEquals(m.xx, n.xx) &&
               epsilonEquals(m.xy, n.xy) &&
               epsilonEquals(m.xz, n.xz) &&
               epsilonEquals(m.yx, n.yx) &&
               epsilonEquals(m.yy, n.yy) &&
               epsilonEquals(m.yz, n.yz) &&
               epsilonEquals(m.zx, n.zx) &&
               epsilonEquals(m.zy, n.zy) &&
               epsilonEquals(m.zz, n.zz);
    };
        
    proto.equals = function(mat){
        return Mat3.equals(this,mat);
    };

    Mat3.copy = function(md,m){
        md.xx = m.xx;
        md.xy = m.xy;
        md.xz = m.xz;
        md.yx = m.yx;
        md.yy = m.yy;
        md.yz = m.yz;
        md.zx = m.zx;
        md.zy = m.zy;
        md.zz = m.zz;
        return md;
    };

    Mat3.set = set;

    Mat3.setArray = setArray;

    Mat3.setId = function(md){
        md.xx = 1;
        md.xy = 0;
        md.xz = 0;
        md.yx = 0;
        md.yy = 1;
        md.yz = 0;
        md.zx = 0;
        md.zy = 0;
        md.zz = 1;
        return md;
    };

    Mat3.setZero = function(md){
        Mat3.copy(md,Mat3.zero);
        return md;
    };

    proto.clone = function(){
        var m = new Mat3();
        Mat3.copy(m,this);
        return m;
    };

    proto.toString = function(){
        var str = "[";
        str += this.xx + ",";
        str += this.xy + ",";
        str += this.xz + ",\n  ";
        str += this.yx + ",";
        str += this.yy + ",";
        str += this.yz + ",\n  ";
        str += this.zx + ",";
        str += this.zy + ",";
        str += this.zz + "]";
        return str;
    };

    Mat3.add = function(md,m){
        md.xx += m.xx;
        md.xy += m.xy;
        md.xz += m.xz;
        md.yx += m.yx;
        md.yy += m.yy;
        md.yz += m.yz;
        md.zx += m.zx;
        md.zy += m.zy;
        md.zz += m.zz;
        return md;
    };

    proto.add = function(mat){
        var md = new Mat3();
        Mat3.copy(md,this);
        Mat3.add(md,mat);
        return md;
    };

    Mat3.sub = function(md,m){
        md.xx -= m.xx;
        md.xy -= m.xy;
        md.xz -= m.xz;
        md.yx -= m.yx;
        md.yy -= m.yy;
        md.yz -= m.yz;
        md.zx -= m.zx;
        md.zy -= m.zy;
        md.zz -= m.zz;
        return md;
    };

    proto.sub = function(mat){
        var md = new Mat3();
        Mat3.copy(md,this);
        Mat3.sub(md,mat);
        return md;
    };

    Mat3.neg = function(md){
        md.xx = -md.xx;
        md.xy = -md.xy;
        md.xz = -md.xz;
        md.yx = -md.yx;
        md.yy = -md.yy;
        md.yz = -md.yz;
        md.zx = -md.zx;
        md.zy = -md.zy;
        md.zz = -md.zz;
    };

    proto.neg = function(mat){
        var md = new Mat3();
        Mat3.copy(md,this);
        Mat3.neg(md);
        return md;
    };

    Mat3.tr = function(md){
        Mat3.copy(tmp,m);
        md.xx = tmp.xx;
        md.xy = tmp.yx;
        md.xz = tmp.zx;
        md.yx = tmp.xy;
        md.yy = tmp.yy;
        md.yz = tmp.zy;
        md.zx = tmp.xz;
        md.zy = tmp.yz;
        md.zz = tmp.zz;
        return md;
    };

    proto.tr = function(){
        var md = new Mat3();
        Mat3.copy(md,this);
        Mat3.tr(md);
        return md;
    };

    Mat3.mult = function(md,m){
        var b = Mat3.copy(tmp,md);
        var a = m;
        if(md === m){
            b = a;
        }
        md.xx = a.xx*b.xx + a.xy*b.yx + a.xz*b.zx; 
        md.xy = a.xx*b.xy + a.xy*b.yy + a.xz*b.zy; 
        md.xz = a.xx*b.xz + a.xy*b.yz + a.xz*b.zz; 

        md.yx = a.yx*b.xx + a.yy*b.yx + a.yz*b.zx; 
        md.yy = a.yx*b.xy + a.yy*b.yy + a.yz*b.zy; 
        md.yz = a.yx*b.xz + a.yy*b.yz + a.yz*b.zz; 

        md.zx = a.zx*b.xx + a.zy*b.yx + a.zz*b.zx; 
        md.zy = a.zx*b.xy + a.zy*b.yy + a.zz*b.zy; 
        md.zz = a.zx*b.xz + a.zy*b.yz + a.zz*b.zz; 
        return md;
    };

    Mat3.multFac  = function(md,fac){
        md.xx *= fac;
        md.xy *= fac;
        md.xz *= fac;
        md.yx *= fac;
        md.yy *= fac;
        md.yz *= fac;
        md.zx *= fac;
        md.zy *= fac;
        md.zz *= fac;
        return md;
    };

    Mat3.multV2 = function(vd,m){
        var vx = vd.x, vy = vd.y;
        var d  = 1.0 / ( vx * m.zx + vy * m.zy + m.zz);
        vd.x = d * ( m.xx * vx + m.xy * vy + m.xz );
        vd.y = d * ( m.yx * vx + m.yy * vy + m.yz );
        return vd;
    };

    proto.mult = function(arg){
        if(typeof arg === 'number'){
            var md = new Mat3();
            Mat3.copy(md,this);
            Mat3.multFac(md,arg);
            return md;
        }else if(arg instanceof Mat3){
            var md = new Mat3();
            Mat3.copy(md,this);
            Mat3.mult(md,arg);
            return md;
        }else if(arg instanceof V2){
            var vd = new V2();
            V2.copy(vd,arg);
            Mat3.multV2(vd,this);
            return vd;
        }else{
            throw new Error('Mat3: mult(), cannot multiply with an object of this type:',typeof arg);
        }
    };

    Mat3.setRotate = function(md,angle){
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        Mat3.setId(md);
        md.xx = c;
        md.xy = -s;
        md.yx = s;
        md.yy = c;
        return md;
    };

    Mat3.rotate = function(angle){
        var md = new Mat3();
        Mat3.setRotate(md,angle);
        return md;
    };

    Mat3.setSkewX = function(md,shear){
        Mat3.setId(md);
        md.xy = shear;
        return md;
    };
    
    Mat3.shearX = function(shear){
        var md = new Mat3();
        md.xy = shear;
        return md;
    };

    Mat3.setSkewY = function(md,shear){
        Mat3.setId(md);
        md.yx = shear;
        return md;
    };
    
    Mat3.shearY = function(shear){
        var md = new Mat3();
        md.yx = shear;
        return md;
    };

    Mat3.setScale = function(md,scale){
        Mat3.setId(md);
        md.xx = scale.x;
        md.yy = scale.y;
        return md;
    };

    Mat3.scale    = function(sv){
        var md = new Mat3();
        Mat3.setScale(md,sv);
        return md;
    };

    Mat3.setTranslate = function(md,vec){
        Mat3.setId(md);
        md.xz = vec.x;
        md.yz = vec.y;
        return md;
    };

    Mat3.translate = function(v){
        var md = new Mat3();
        Mat3.setTranslate(md,v);
        return md;
    };

    var tmp_tr = new Mat3();
    Mat3.setTransform = function(md,pos,scale,angle){
        Mat3.setScale(md,scale); //FIXME
        Mat3.setRotate(tmp_tr,angle);
        Mat3.mult(md,tmp_tr);
        Mat3.setTranslate(tmp_tr,pos);
        Mat3.mult(md,tmp_tr);
        return md;
    };

    Mat3.transform   = function(pos,scale,angle){
        var md = new Mat3();
        Mat3.setTransform(md,pos,scale,angle);
        return md;
    };

    proto.getScale = function(){};
    proto.getRotate = function(){};
    proto.getTranslate = function(){};

    Mat3.det = function(m){
        return m.xx*(m.zz*m.yy-m.zy*m.yz) - m.yx*(m.zz*m.xy-m.zy*m.xz) + m.zx*(m.yz*m.xy-m.yy*m.xz);
    };

    proto.det = function(){
        return Mat3.det(this);
    };

    Mat3.invert  = function(md){
        var det = Mat3.det(md);
        var m = Mat3.copy(tmp,md);

        // http://www.dr-lex.be/random/matrix_inv.html
        // | m.xx m.xy m.xz |               |   m.zz m.yy-m.zy m.yz  -(m.zz m.xy-m.zy m.xz)   m.yz m.xy-m.yy m.xz  |
        // | m.yx m.yy m.yz |    =  1/DET * | -(m.zz m.yx-m.zx m.yz)   m.zz m.xx-m.zx m.xz  -(m.yz m.xx-m.yx m.xz) |
        // | m.zx m.zy m.zz |               |   m.zy m.yx-m.zx m.yy  -(m.zy m.xx-m.zx m.xy)   m.yy m.xx-m.yx m.xy  |
        
        det = 1 / det;

        md.xx =  det*( m.zz*m.yy-m.zy*m.yz );
        md.xy = -det*( m.zz*m.xy-m.zy*m.xz );
        md.xz =  det*( m.yz*m.xy-m.yy*m.xz );
        
        md.yx = -det*( m.zz*m.yx-m.zx*m.yz );
        md.yy =  det*( m.zz*m.xx-m.zx*m.xz );
        md.yz = -det*( m.yz*m.xx-m.yx*m.xz );

        md.zx =  det*( m.zy*m.yx-m.zx*m.yy );
        md.zy = -det*( m.zy*m.xx-m.zx*m.xy );
        md.zz =  det*( m.yy*m.xx-m.yx*m.xy );
        return md;
    };

    proto.invert = function(){
        var md = new Mat3();
        Mat3.copy(md,this);
        Mat3.invert(md);
        return md;
    };

    var map = [ ['xx','xy','xz'],
                ['yx','yy','yz'],
                ['zx','zy','zz'] ];
    
    proto.ij = function(i,j){
        return this[ map[i][j] ];
    };

    Mat3.toArray = function(array,m,offset){
        offset = offset || 0;
        // 0 3 6 | xx xy xz
        // 1 4 7 | yx yy yz
        // 2 5 8 | zx zy zz
        array[0+offset] = m.xx;
        array[1+offset] = m.yx;
        array[2+offset] = m.zx;
        array[3+offset] = m.xy;
        array[4+offset] = m.yy;
        array[5+offset] = m.zy;
        array[6+offset] = m.xz;
        array[7+offset] = m.yz;
        array[8+offset] = m.zz;
    };

    proto.array = function(){
        var array = [];
        Mat3.toArray(array,this);
        return array;
    };

    proto.float32 = function(){
        var array = Float32Array(9);
        Mat3.toArray(array,this);
        return array;
    };

})(typeof exports === 'undefined' ? ( this['modula'] || (this['modula'] = {})) : exports );

},{"./V2.js":7}],5:[function(require,module,exports){

/* ----- 2D Bounding Rectangle ----- */

(function(modula){

    var V2 = modula.V2 || typeof 'require' !== 'undefined' ? require('./V2.js').V2 : null;

    if(!V2 ){
        throw new Error('modula.Rect requires modula.V2');
    }

    function Rect(x,y,sx,sy,centered){
        this.sx = sx;           // width of the rectangle on the x axis
        this.sy = sy;           // width of the rectangle on the y axis
        this.hx = sx/2;         // half of the rectangle width on the x axis
        this.hy = sy/2;         // half of the rectangle width on the y axis
        this.x  = x;            // minimum x coordinate contained in the rectangle  
        this.y  = y;            // minimum y coordinate contained in the rectangle
        this.cx = x + this.hx;   // x coordinate of the rectangle center
        this.cy = y + this.hy;   // y coordinate of the rectangle center
        this.mx = this.x + sx;   // maximum x coordinate contained in the rectangle
        this.my = this.y + sy;   // maximum x coordinate contained in the rectangle
        if(centered){
            this.x -= this.hx;
            this.cx -= this.hx;
            this.mx -= this.hx;
            this.y -= this.hy;
            this.cy -= this.hy;
            this.my -= this.hy;
        }
    }

    modula.Rect = Rect;

    Rect.prototype.min = function(){  return new V2(this.x, this.y); };
    Rect.prototype.minX = function(){ return this.x; };
    Rect.prototype.minY = function(){ return this.y; };
    Rect.prototype.max = function(){  return new V2(this.mx, this.my); };
    Rect.prototype.maxX = function(){ return this.mx; };
    Rect.prototype.maxY = function(){ return this.my; };
    Rect.prototype.size = function(){ return new V2(this.sx, this.sy); };
    Rect.prototype.center = function(){return new V2(this.cx, this.cy); };
    Rect.prototype.equals = function(b){ return ( this.cx === b.cx && this.cy === b.cy && this.sx === b.sx && this.sy === b.sy); };
    Rect.prototype.clone  = function(){  return new Rect(this.x,this.y,this.sx, this.sy)};
    Rect.prototype.cloneAt = function(center){ return new Rect(center.x - this.hx, center.y -this.hy, this.sx, this.sy); };

    //intersect line a,b with line c,d, returns null if no intersection
    function lineIntersect(a,b,c,d){
        // http://paulbourke.net/geometry/lineline2d/
        var f = ((d.y - c.y)*(b.x - a.x) - (d.x - c.x)*(b.y - a.y)); 
        if(f == 0){
            return null;
        }
        f = 1 / f;
        var fab = ((d.x - c.x)*(a.y - c.y) - (d.y - c.y)*(a.x - c.x)) * f ;
        if(fab < 0 || fab > 1){
            return null;
        }
        var fcd = ((b.x - a.x)*(a.y - c.y) - (b.y - a.y)*(a.x - c.x)) * f ;
        if(fcd < 0 || fcd > 1){
            return null;
        }
        return new V2(a.x + fab * (b.x-a.x), a.y + fab * (b.y - a.y) );
    }

    // returns an unordered list of vector defining the positions of the intersections between the ellipse's
    // boundary and a line segment defined by the start and end vectors a,b

    Rect.prototype.collideSegment = function(a,b){
        var collisions = [];
        var corners = [ new V2(this.x,this.y), new V2(this.x,this.my), 
                        new V2(this.mx,this.my), new V2(this.mx,this.y) ];
        var pos = lineIntersect(a,b,corners[0],corners[1]);
        if(pos) collisions.push(pos);
        pos = lineIntersect(a,b,corners[1],corners[2]);
        if(pos) collisions.push(pos);
        pos = lineIntersect(a,b,corners[2],corners[3]);
        if(pos) collisions.push(pos);
        pos = lineIntersect(a,b,corners[3],corners[0]);
        if(pos) collisions.push(pos);
        return collisions;
    };
    Rect.prototype.contains = function(arg){
        if(arg instanceof V2){
            return ( arg.x >= this.x && arg.x <= this.mx &&
                     arg.y >= this.y && arg.y <= this.my );
        }else if(arguments.length === 2){
            return this.contains(new V2(arguments[0],arguments[1]));
        }else if( arg instanceof Rect){
            return (arg.x >= this.x && arg.mx <= this.mx &&
                    arg.y >= this.y && arg.my <= this.my );
        }else if(arg instanceof Bound){
            return (arg.minX() >= this.x && arg.maxX() <= this.mx &&
                    arg.minY() >= this.y && arg.maxY() <= this.my );
        }
        return false;
    };

    function boundCollides(amin, amax, bmin, bmax){
        if(amin + amax < bmin + bmax){
            return amax > bmin;
        }else{
            return amin < bmax;
        }
    }
    
    function boundEscapeDist(amin, amax, bmin, bmax){
        if(amin + amax < bmin + bmax){
            var disp = bmin - amax;
            if(disp >= 0){
                return 0;
            }else{
                return disp;
            }
        }else{
            var disp = bmax - amin;
            if(disp <= 0){
                return 0;
            }else{
                return disp;
            }
        }
    }

    Rect.prototype.collides = function(b){
        return boundCollides(this.x, this.mx, b.x, b.mx) && 
               boundCollides(this.y, this.my, b.y, b.my);
    };
    
    Rect.prototype.collisionAxis = function(b){
        var dx = boundEscapeDist(this.x, this.mx, b.x, b.mx); 
        var dy = boundEscapeDist(this.y, this.my, b.y, b.my);
        if( Math.abs(dx) < Math.abs(dy) ){
            return new V2(dx,0);
        }else{
            return new V2(0,dy);
        }
    };
    
    Rect.prototype.collisionVector = function(b){
        return new V2( 
            boundEscapeDist(this.x, this.mx, b.x, b.mx),
            boundEscapeDist(this.y, this.my, b.y, b.my)  
        );
    };

    Rect.prototype.translate = function(vec){
        return new Rect(this.x+vec.x,this.y+vec.y,this.sx,this.sy);
    };

    Rect.prototype.toString = function(){
        return "["+this.cx+","+this.cy+"|"+this.sx+","+this.sy+"]";
    };

})(typeof exports === 'undefined' ? ( this['modula'] || (this['modula'] = {})) : exports );

},{"./V2.js":7}],6:[function(require,module,exports){

/* ----- 2D Scene-Graph Transforms ----- */

(function(modula){

    var V2 = modula.V2 || typeof 'require' !== 'undefined' ? require('./V2.js').V2 : null;
    if(!V2){
        throw new Error('modula.Transform2 requires modula.V2');
    }
    var Mat3 = modula.Mat3 || typeof 'require' !== 'undefined' ? require('./Mat3.js').Mat3 : null;
    if(!Mat3){
        throw new Error('modula.Transform2 requires modula.Mat3');
    }

    function Transform2(tr){
        tr = tr || {};
        this.pos = tr.pos ? tr.pos.clone() : new V2();
        if(tr.scale){
            if(typeof tr.scale === 'number'){
                this.scale = new V2(tr.scale,tr.scale);
            }else{
                this.scale = tr.scale.clone();
            }
        }else{
            this.scale = new V2(1,1);
        }
        this.rotation = tr.rotation !== undefined ? tr.rotation : 0;

        this.parent = null;
        this.childs = [];

        if(tr.parent){
            tr.parent.addChild(this);
        }
        if(tr.childs){
            for(var i = 0, len = tr.childs.length; i < len; i++){
                this.addChild(tr.childs[i]);
            }
        }
        this.localToParentMatrix = null;
        this.parentToLocalMatrix = null;
        this.localToWorldMatrix  = null;
        this.worldToLocalMatrix  = null;
    }

    modula.Transform2 = Transform2;

    var proto = Transform2.prototype;

    var epsilon = 0.00000001;

    var epsilonEquals = function(a,b){
        return Math.abs(a-b) <= 0.0000001;
    };

    function reset_matrix(tr){
        if(tr.localToParentMatrix){
            tr.localToParentMatrix = null;
            tr.parentToLocalMatrix = null;
            tr.localToWorldMatrix  = null;
            tr.worldToLocalMatrix  = null;
            for(var i = 0, len = tr.childs.length; i < len; i++){
                reset_matrix(tr.childs[i]);
            }
        }
    }

    function make_matrix(tr){
        if(!tr.localToParentMatrix){
            tr.localToParentMatrix = Mat3.transform(tr.pos,tr.scale,tr.rotation);
            tr.parentToLocalMatrix = tr.localToParentMatrix.invert();
            if(tr.parent){
                make_matrix(tr.parent);
                // tr.localToWorldMatrix = tr.parent.localToWorldMatrix.mult(tr.localToParentMatrix); 
                tr.localToWorldMatrix = tr.localToParentMatrix.mult(tr.parent.localToWorldMatrix);  //INVERTED
                tr.worldToLocalMatrix = tr.localToWorldMatrix.invert();
            }else{
                tr.localToWorldMatrix = tr.localToParentMatrix;
                tr.worldToLocalMatrix = tr.parentToLocalMatrix;
            }
        }
    }

    proto.getLocalToParentMatrix = function(){
        if(!this.localToParentMatrix){
            make_matrix(this);
        }
        return this.localToParentMatrix;
    };

    proto.getParentToLocalMatrix = function(){
        if(!this.parentToLocalMatrix){
            make_matrix(this);
        }
        return this.parentToLocalMatrix;
    };
    
    proto.getLocalToWorldMatrix = function(){
        if(!this.localToWorldMatrix){
            make_matrix(this);
        }
        return this.localToWorldMatrix;
    };
    
    proto.getWorldToLocalMatrix = function(){
        if(!this.worldToLocalMatrix){
            make_matrix(this);
        }
        return this.worldToLocalMatrix;
    };
    
    proto.getDistantToLocalMatrix = function(dist){
        //return this.getWorldToLocalMatrix().mult(dist.getLocalToWorldMatrix());
        return dist.getLocalToWorldMatrix().mult(this.getWorldToLocalMatrix());
    }
    
    proto.getLocalToDistantMatrix = function(dist){
        //return this.getLocalToWorldMatrix().mult(dist.getWorldToLocalMatrix());
        return dist.getWorldToLocalMatrix().mult(this.getLocalToWorldMatrix()); //FIXME looks fishy ...
    }
    
    proto.equals = function(tr){
        return  this.fullType === tr.fullType &&
            this.pos.equals(tr.pos) &&
            epsilonEquals(this.rotation, tr.rotation) &&
            epsilonEquals(this.scale.x, tr.scale.y);
    };
    
    proto.clone = function(){
        var tr = new Transform2();
        tr.pos  = this.pos.clone();
        tr.scale = this.scale.clone();
        tr.rotation = this.rotation;
        return tr;
    };
    
    proto.setPos = function(vec){
        this.pos.x = vec.x;
        this.pos.y = vec.y;
        reset_matrix(this);
        return this;
    };
    
    proto.setScale = function(scale){
        if((typeof scale) === 'number'){
            this.scale.x = scale;
            this.scale.y = scale;
        }else{
            this.scale.x = scale.x; 
            this.scale.y = scale.y; 
        }
        reset_matrix(this);
        return this;
    };
    
    proto.setRotation = function(rotation){
        this.rotation = rotation;
        reset_matrix(this);
        return this;
    };
    
    proto.getPos = function(){
        return this.pos.clone();
    };
    
    proto.getScale = function(){
        return this.scale.clone();
    };
    
    proto.getScaleFac = function(){
        return Math.max(this.scale.x,this.scale.y);
    };
    
    proto.getRotation = function(){
        return this.rotation;
    };
    
    proto.getWorldPos = function(){
        return this.getLocalToWorldMatrix().mult(V2.zero);
    };
    
    proto.parentToLocal = function(vec){
        return this.getParentToLocalMatrix().mult(vec);
    };
    
    proto.worldToLocal = function(vec){
        return this.getWorldToLocalMatrix().mult(vec);
    };
    
    proto.localToParent = function(vec){
        return this.getLocalToParentMatrix().mult(vec);
    };
    
    proto.localToWorld = function(vec){
        return this.getLocalToWorldMatrix().mult(vec);
    };
    
    proto.distantToLocal = function(distTransform, vec){
        vec = distTransform.localToWorld(vec);
        return this.worldToLocal(vec);
    };

    proto.localToDistant = function(dist, vec){
        vec = this.localToWorld(vec);
        return dist.worldToLocal(vec);
    };

    proto.X = function(){
        return this.localToWorld(V2.x).sub(this.getWorldPos()).normalize();
    };
    
    proto.Y = function(){
        return this.localToWorld(V2.y).sub(this.getWorldPos()).normalize();
    };

    proto.dist = function(tr){
        return tr.getWorldPos().sub(this.getWorldPos());
    };
    
    proto.addChild = function(tr){
        if(tr.parent != this){
            tr.makeRoot();
            tr.parent = this;
            this.childs.push(tr);
        }
        return this;
    };
    
    proto.remChild = function(tr){
        if(tr && tr.parent === this){
            tr.makeRoot();
        }
        return this;
    };
    
    proto.getChildCount = function(){
        return this.childs.length;
    };
    
    proto.getChild = function(index){
        return this.childs[index];
    };
    
    proto.getRoot  = function(){
        if(this.parent){
            return this.parent.getRoot();
        }else{
            return this;
        }
    };
    
    proto.makeRoot = function(){
        if(this.parent){
            var pchilds = this.parent.childs;
            for(var i = 0; i < pchilds.length; i++){
                while(pchilds[i] === this){
                    pchilds.splice(i,1);
                }
            }
            this.parent = null;
        }
        return this;
    };
    
    proto.isLeaf   = function(){ return this.childs.length === 0; };
    
    proto.isRoot   = function(){ return !this.parent; };
    
    proto.rotate = function(angle){ 
        this.rotation += angle;
        reset_matrix(this);
        return this;
    };
    
    proto.scale = function(scale){
        this.scale.x *= scale.x;
        this.scale.y *= scale.y;
        reset_matrix(this);
        return this;
    };
    
    proto.scaleFac = function(f){
        this.scale.x *= f;
        this.scale.y *= f;
        reset_matrix(this);
        return this;
    };
    
    proto.translate = function(deltaPos){
        this.pos.x += deltaPos.x;
        this.pos.y += deltaPos.y;
        reset_matrix(this);
        return this;
    };

})(typeof exports === 'undefined' ? ( this['modula'] || (this['modula'] = {})) : exports );

},{"./Mat3.js":4,"./V2.js":7}],7:[function(require,module,exports){

/* ----- 2D Vectors ----- */

(function(modula){
    
    function V2(){
        var self = this;
        if(this.constructor !== V2){
            self = new V2();
        }
    	var alen = arguments.length;      
    	if(alen === 0){
            self.x = 0.0;
            self.y = 0.0;
        }else if (alen === 1){
        	var arg = arguments[0];
        	if  (typeof arg === 'string'){
        		arg = JSON.parse(arg);
        	}
            if(typeof arg === 'number'){
                self.x = arg;
                self.y = arg;
            }else if(typeof arg.angle === 'number' || typeof arg.len === 'number'){
                V2.setPolar(self, (arg.len === undefined ? 1 : arg.len), arg.angle || 0);
            }else if(arg[0] !== undefined){
                self.x = arg[0] || 0;
                self.y = arg[1] || 0;
            }else{
            	self.x = arg.x || 0;
            	self.y = arg.y || 0;
            }
        }else if (alen === 2){
            self.x = arguments[0];
            self.y = arguments[1];
        }else{
            throw new Error("wrong number of arguments:"+arguments.length);
        }
        return self;
    }

    modula.V2 = V2;

    var proto = V2.prototype;
    
    V2.zero     = new V2();
    V2.x        = new V2(1,0);
    V2.y        = new V2(0,1);

    var tmp       = new V2();
    var tmp1      = new V2();
    var tmp2      = new V2();

    var epsilon = 0.00000001;
    
    // sets vd to a vector of length 'len' and angle 'angle' radians
    V2.setPolar = function(vd,len,angle){
    	vd.x = len;
        vd.y = 0;
        V2.rotate(vd,angle);
        return vd;
    };

    V2.polar = function(len,angle){
        var v = new V2();
        V2.setPolar(v,len,angle);
        return v;
    };

	V2.random = function(){
		return new V2(Math.random()*2 - 1, Math.random()*2 - 1);
	}

    V2.randomPositive = function(){
        return new V2(Math.random(),Math.random());
    };

    V2.randomDisc = function(){
    	var v = new V2();
        do{
            v.x = Math.random() * 2 - 1;
            v.y = Math.random() * 2 - 1;
        }while(v.lenSq() > 1);
        return v;
    };

    V2.isZero  = function(v){
        return Math.abs(v.x) <= epsilon && Math.abs(v.y) <= epsilon;
    };

    proto.isZero = function(){
        return Math.abs(this.x) <= epsilon && Math.abs(this.y) <= epsilon;
    };

    V2.isNaN = function(v){
        return Number.isNaN(v.x) || Number.isNaN(v.y);
    };

    proto.isNaN = function(){
        return V2.isNaN(this);
    };


    V2.len = function(v){
        return Math.sqrt(v.x*v.x + v.y*v.y);
    };

    proto.len = function(){
        return Math.sqrt(this.x*this.x + this.y*this.y);
    };

    V2.lenSq = function(v){
        return v.x*v.x + v.y*v.y;
    };
    
    proto.lenSq = function(){
        return this.x*this.x + this.y*this.y;
    };
    
    V2.dist = function(v1,v2){
        var dx = v1.x - v2.x;
        var dy = v1.y - v2.y;
        return Math.sqrt(dx*dx + dy*dy);
    };

    proto.dist = function(v){
        return V2.dist(this,v);
    };
    
    V2.distSq = function(v1,v2){
        var dx = v1.x - v2.x;
        var dy = v1.y - v2.y;
        return dx*dx + dy*dy;
    };

    proto.distSq = function(v){
        return V2.distSq(this,v);
    };
    
    V2.dot = function(v1,v2){
        return v1.x*v2.x + v2.y*v2.y;
    }

    proto.dot = function(v){
        return this.x*v.x + this.y*v.y;
    };
    
    V2.set  = function(vd,vx,vy){
        vd.x = vx;
        vd.y = vy;
        return vd;
    };
    
    V2.setArray = function(vd,array,offset){
        offset = offset || 0;
        vd.x = array[offset];
        vd.y = array[offset+1];
        return vd;
    };


    V2.copy = function(vd,v){
        vd.x = v.x;
        vd.y = v.y;
        return vd;
    };

    proto.copy = function(){
        return new V2(this.x,this.y);
    };
    
    V2.add = function(vd,v){
        vd.x += v.x;
        vd.y += v.x;
        return vd;
    };

    proto.add = function(v){
        return new V2(this.x+v.x,this.y+v.y);
    };
    
    V2.addScaled = function(vd,v,scale){
        vd.x += v.x * scale;
        vd.y += v.y * scale;
        return vd;
    };

    proto.addScaled = function(v,scale){
        var vd = new V2();
        V2.copy(vd,this);
        V2.addScaled(vd,v,scale);
        return vd;
    };
    
    V2.sub = function(vd,v){
        vd.x -= v.x;
        vd.y -= v.y;
        return vd;
    };

    proto.sub = function(v){
        return new V2(this.x-v.x,this.y-v.y);
    };

    V2.mult = function(vd,v){
        vd.x *= v.x;
        vd.y *= v.y;
        return vd;
    };

    proto.mult = function(v){
        if(typeof v === 'number'){
            return new V2(this.x*v,this.y*v);
        }else{
            return new V2(this.x*v.x,this.y*v.y);
        }
    };
    
    V2.scale = function(vd,f){
        vd.x *= f;
        vd.y *= f;
        return vd;
    };
    
    proto.scale = function(f){
        return new V2(this.x*f, this.y*f);
    };
    
    V2.neg = function(vd){
        vd.x = -vd.x;
        vd.y = -vd.y;
        return vd;
    };

    proto.neg = function(f){
        return new V2(-this.x,-this.y);
    };

    V2.div = function(vd,v){
        vd.x = vd.x / v.x;
        vd.y = vd.y / v.y;
        return vd;
    };

    proto.div = function(v){
        return new V2(this.x/v.x,this.y/v.y);
    };

    V2.invert = function(vd){
        vd.x = 1.0/vd.x;
        vd.y = 1.0/vd.y;
        return vd;
    };

    proto.invert = function(){
        return new V2(1/this.x,1/this.y);
    };

    V2.pow = function(vd,pow){
        vd.x = Math.pow(vd.x,pow);
        vd.y = Math.pow(vd.y,pow);
        return vd;
    };

    proto.pow = function(pow){
        return new V2(Math.pow(this.x,pow), Math.pow(this.y,pow));
    };

    V2.sq = function(vd){
        vd.x = vd.x * vd.x;
        vd.y = vd.y * vd.y;
        return vd;
    };
    
    proto.sq = function(){
        return new V2(this.x*this.x,this.y*this.y);
    };
   
    V2.normalize = function(vd){
        var len = vd.lenSq();
        if(len === 0){
            vd.x = 1;
            vd.y = 0;
        }else if(len !== 1){
            len = 1 / Math.sqrt(len);
            vd.x = vd.x * len;
            vd.y = vd.y * len;
        }
        return vd;
    };
            
    proto.normalize = function(){
        var vd = new V2();
        V2.copy(vd,this);
        V2.normalize(vd);
        return vd;
    };
    
    V2.setLen = function(vd,l){
        V2.normalize(vd);
        V2.scale(vd,l);
        return vd;
    };

    proto.setLen = function(l){
        var vd = new V2();
        V2.copy(vd,this);
        V2.setLen(vd,l);
        return vd;
    };

    V2.project = function(vd,v){
        V2.copy(tmp,v);
        V2.normalize(tmp);
        var dot = V2.dot(vd,tmp);
        V2.copy(vd,tmp);
        V2.setLen(vd,dot);
        return vd;
    };
    
    proto.project = function(v){
        var vd = new V2();
        V2.copy(vd,this);
        V2.project(vd,v);
        return vd;
    };

    proto.toString = function(){
        var str = "[";
        str += this.x ;
        str += "," ;
        str += this.y ;
        str += "]" ;
        return str;
    };
    
    
    V2.rotate = function(vd,rad){
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        var vx = vd.x * c - vd.y *s;
        var vy = vd.x * s + vd.y *c;
        vd.x = vx;
        vd.y = vy;
        return vd;
    };
        
    proto.rotate = function(rad){
        var vd = new V2();
        V2.copy(vd,this);
        V2.rotate(vd,rad);
        return vd;
    };
    
    V2.lerp = function(vd,v,alpha){
        var invAlpha = 1- alpha;
        vd.x = vd.x * invAlpha + v.x * alpha;
        vd.y = vd.y * invAlpha + v.y * alpha;
        return vd;
    };

    proto.lerp = function(v,alpha){
        var vd = new V2();
        V2.copy(vd,this);
        V2.lerp(vd,v,alpha);
        return vd;
    };
    
    V2.azimuth = function(v){
        return Math.atan2(v.y,v.x);
    };

    proto.azimuth = function(){
        return Math.atan2(this.y,this.x);
    };
    
    V2.equals = function(u,v){
        return Math.abs(u.x-v.x) <= epsilon && Math.abs(u.y - v.y) <= epsilon;
    };

    proto.equals = function(v){
        return V2.equals(this,v);
    };
    
    V2.round  = function(vd){
        vd.x = Math.round(vd.x);
        vd.y = Math.round(vd.y);
        return vd;
    };

    proto.round = function(){
        return new V2(Math.round(this.x),Math.round(this.y));
    };

    V2.floor = function(vd){
        vd.x = Math.floor(vd.x);
        vd.y = Math.floor(vd.y);
        return vd;
    };

    proto.floor = function(){
        return new V2(Math.floor(this.x),Math.floor(this.y));
    };

    V2.ceil = function(vd){
        vd.x = Math.ceil(vd.x);
        vd.y = Math.ceil(vd.y);
        return vd;
    };

    proto.ceil = function(){
        return new V2(Math.ceil(this.x),Math.ceil(this.y));
    };

    V2.crossArea = function(u,v){
        return u.x * v.y - u.y * v.y;
    };

    proto.crossArea = function(v){
        return this.x * v.y - this.y * v.x;
    };

    V2.reflect = function(vd,vn){
        V2.copy(tmp,vn);
        V2.normalize(tmp);
        var dot2 = V2.dot(vd,tmp) * 2;
        vd.x = vd.x - vn.x * dot2;
        vd.y = vd.y - vn.y * dot2;
        return vd;
    };

    proto.reflect = function(vn){
        var vd = new V2();
        V2.copy(vd,this);
        V2.reflect(vd,vn);
        return vd;
    };

    V2.toArray = function(array,v,offset){
        offset = offset || 0;
        array[offset]   = v.x;
        array[offset+1] = v.y;
        return array;
    };

    proto.array   = function(){
        return [this.x,this.y];
    };

    proto.float32 = function(){
        var a = new Float32Array(2);
        a[0] = this.x;
        a[1] = this.y;
        return a;
    };

})(typeof exports === 'undefined' ? ( this['modula'] || (this['modula'] = {})) : exports );

},{}]},{},[1])