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
            enemy.takeDamage(this.enemyDamage);
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

    /* -------- ENTITY --------- */

    function Entity(options){
        this.main  = options.main;
        this.game  = options.main.scene;
        this.pos   = V2();
        this.speed = V2();
        this.health = this.maxHealth;
        this.destroyed = false;
        this.started   = false;
        if(this.radius){
            this.sqRadius = this.radius*this.radius;
        }
    }

    Entity.prototype = {
        maxHealth: 1,
        takeDamage: function(damage){
            this.health -= damage;
            if(this.health <= 0){
                this.destroy();
            }
        },
        damageCell: function(x,y,damage){
            var grid = this.game.world.grid;
            var cell = grid.getCell(x,y);
            if(cell){
                var value = -Math.max(0,Math.abs(cell)-damage); // flipped to indicate damage
                grid.setCell(x,y,value);
            }
        },
        destroy: function(){
            this.destroyed = true;
        },
    };


    /* -------- PLAYER --------- */

    function Player(options){
        Entity.call(this,options);
        this.cpos  = V2();
        this.weapons = {
            'default':new Weapon({player:this}),
            'lasers': new Lasers({player:this}),
        };
        this.weapon = this.weapons.default;
    }

    extend(Player,Entity,{
        radius: 10,
        maxSpeed: 150,
        wallDamage: 0.05,
        takeDamage: function(){
            this.game.restart();
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
    });

    /* -------- ENNEMIES --------- */

    function Grunt(options){
        Entity.call(this,options);
        this.speed = V2.randomDisc().setLen(this.maxSpeed);
        this.aim   = this.speed.normalize();
        this.timeout = 0;
        this.fireTime = 0;
        this.fireSequence = 1;
        this.projectiles = [];
        this.warmup = 0;
        this.mythosisTime = -1;
    }

    extend(Grunt, Entity, {
        radius: 12,
        fireInterval: 0.1,
        maxSpeed: 60,
        radius: 12,
        takeDamage: function(){
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
    });

    function Soldier(options){
        Entity.call(this,options);
        this.speed = V2.randomDisc().setLen(this.maxSpeed);
        this.aim   = this.speed.normalize();
        this.radius = 15;
        this.sqRadius = this.radius * this.radius;
        this.timeout = 0;
        this.fireTime = 0;
        this.fireSequence = 1;
        this.warmup = 0;
        this.damaged = false;
    }

    extend(Soldier, Entity, {
        maxHealth: 10,
        maxSpeed: 60,
        fireInterval: 0.7,
        takeDamage: function(amount){
            Entity.prototype.takeDamage.call(this,amount);
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
    });

    function Kamikaze(options){
        Entity.call(this,options);
        this.pos = options.pos;
        this.speed = V2.randomDisc().setLen(this.maxSpeed);
        this.timeout = 0;
        this.warmup = 0;
        this.damaged = false;
    }

    extend(Kamikaze, Entity, {
        maxHealth: 25,
        maxSpeed: 60,
        chaseSpeed: 125,
        radius: 15,
        wallDamage: 0.035,
        takeDamage: function(amount){
            Entity.prototype.takeDamage.call(this,amount);
            this.fireTime = this.main.time + this.fireInterval;
            this.pos = this.pos.addScaled(this.speed,this.main.deltaTime* -0.3);
            this.damaged = true;
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
                this.game.player.takeDamage();
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
    });


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
                    this.addEnemy(new Soldier({main: this.main, pos:this.player.pos.add(V2.randomDisc().scale(1000))}));
                }else if(Math.random() < 0.2){
                    this.addEnemy(new Grunt({main: this.main, pos:this.player.pos.add(V2.randomDisc().scale(1000))}));
                }else{
                    this.addEnemy(new Kamikaze({main: this.main, pos:this.player.pos.add(V2.randomDisc().scale(1000))}));
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
    "use strict";

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
    };

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

        var dist = opts.dist ?
                   function(){ return opts.dist.apply(self,arguments); }
                 : function(){ return self.dist.apply(self,arguments); };

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
                    if(nx !== x || ny !== y){
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
                if( i === len -1){
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
                var child1 = null;

                if(child1N < length ){ 
                    child1 = this.content[child1N];
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
        }
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

        var get_neighbors = opts.neighbors ?
                            function(x,y){ return opts.neighbors.call(self,x,y); }
                          : ( opts.nodiags ?
                              function(x,y){ return self._neighborsNoDiags(x,y);} 
                            : function(x,y){ return self._neighbors(x,y); }
                            );
        
        var is_solid = opts.isSolid ?
                       function(x,y) { return opts.isSolid.call(self,x,y); }
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
                
                if(is_solid(neighbor.x, neighbor.y) || closedset.contains(neighbor)){
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
            for(var j = 0, jlen = result.length; j < jlen; j++){
                var r = result[j];
                    r.cell = this.getCellUnsafe(r.x,r.y);
                iterator.call(this,r.x,r.y,r.cell,j,jlen);
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
        var tminx, tmaxx, tminy, tmaxy;

        if( iRx >= 0 ){
            tminx = ( minx - Ox) * iRx;
            tmaxx = ( maxx - Ox) * iRx;
        }else{
            tminx = ( maxx - Ox) * iRx;
            tmaxx = ( minx - Ox) * iRx;
        }
        if( iRy >= 0 ){
            tminy = ( miny - Oy) * iRy;
            tmaxy = ( maxy - Oy) * iRy;
        }else{
            tminy = ( maxy - Oy) * iRy;
            tmaxy = ( miny - Oy) * iRy;
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
    };

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
            var start = rayIntersectBox(startX,startY,dirX,dirY,0,0,this.cellSizeX*this.sizeX, this.cellSizeY*this.sizeY);
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
 
        var cx    = this.sizeX;
        var cy    = this.sizeY;
        var csx   = this.cellSizeX;
        var csy   = this.cellSizeY;

        if(maxX <= 0 || maxY <= 0 || minX >= cx*csx || minY >= cy*csy){
            return;
        }

        var is_solid  = opts.isSolid ?
                        function(x,y){ return opts.solidity.call(this,x,y); }
                      : function(x,y){ return self.isSolid(x,y); };

        //we transform everything so that the cells are squares of size 1.

        var isx   = 1 / csx;
        var isy   = 1 / csy;

        minX *= isx;
        minY *= isy;
        maxX *= isx;
        maxY *= isy;

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

        var dx = 0, dy = 0;

        // at this point we are back in world sizes 

        if(min_px === max_px && min_py === max_py){
            // in the middle of one block
            if(is_solid(min_px,min_py)){
                dx = esc_l < -esc_r ? esc_l : esc_r;
                dy = esc_u < -esc_d ? esc_u : esc_d;
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
                    sx = esc_l - esc_r;
                    sy = esc_u - esc_d;
                    cx = -esc_r - sx*0.5;
                    cy = -(-esc_d - sy*0.5);

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

})(typeof exports === 'undefined' ? ( this.modula || (this.modula = {})) : exports );


},{}],3:[function(require,module,exports){

/* ------ Input Handling ----- */

(function(modula){
    "use strict";

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

            for(var key in this.status){
                if(this.status.hasOwnProperty(key)){
                    this.status[key] = transition[this.status[key] || 'up'];
                }
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
})(typeof exports === 'undefined' ? ( this.modula || (this.modula = {})) : exports );


},{"./V2.js":7}],4:[function(require,module,exports){

/* ------ 3x3 Matrix for 2D Transformations ----- */

(function(modula){
    "use strict";

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

    var set = function(md /*, components ... */){
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
            if(arg[0] !== undefined){
                setArray(self,arg);
            }else if( typeof arg.rotate === 'number' || 
                      typeof arg.scale === 'number'  || 
                      typeof arg.translate === 'number' ){
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
    }

    modula.Mat3 = Mat3;

    Mat3.id       = new Mat3();
    Mat3.zero     = new Mat3(0,0,0,0,0,0,0,0,0);

    var tmp = new Mat3();

    var proto = Mat3.prototype;

    var epsilon = 0.00000001;

    function epsilonEquals(a,b){  return Math.abs(a-b) <= epsilon; }

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

    proto.neg = function(){
        var md = new Mat3();
        Mat3.copy(md,this);
        Mat3.neg(md);
        return md;
    };

    Mat3.tr = function(md){
        Mat3.copy(tmp,md);
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
        var md,vd;
        if(typeof arg === 'number'){
            md = new Mat3();
            Mat3.copy(md,this);
            Mat3.multFac(md,arg);
            return md;
        }else if(arg instanceof Mat3){
            md = new Mat3();
            Mat3.copy(md,this);
            Mat3.mult(md,arg);
            return md;
        }else if(arg instanceof V2){
            vd = new V2();
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
        var array = new Float32Array(9);
        Mat3.toArray(array,this);
        return array;
    };

})(typeof exports === 'undefined' ? ( this.modula || (this.modula = {})) : exports );


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

    Rect.prototype._isBound = true;
    Rect.prototype.min = function(){  return new V2(this.x, this.y); };
    Rect.prototype.minX = function(){ return this.x; };
    Rect.prototype.minY = function(){ return this.y; };
    Rect.prototype.max = function(){  return new V2(this.mx, this.my); };
    Rect.prototype.maxX = function(){ return this.mx; };
    Rect.prototype.maxY = function(){ return this.my; };
    Rect.prototype.size = function(){ return new V2(this.sx, this.sy); };
    Rect.prototype.center = function(){return new V2(this.cx, this.cy); };
    Rect.prototype.equals = function(b){ return ( this.cx === b.cx && this.cy === b.cy && this.sx === b.sx && this.sy === b.sy); };
    Rect.prototype.clone  = function(){  return new Rect(this.x,this.y,this.sx, this.sy); };
    Rect.prototype.cloneAt = function(center){ return new Rect(center.x - this.hx, center.y -this.hy, this.sx, this.sy); };

    //intersect line a,b with line c,d, returns null if no intersection
    function lineIntersect(a,b,c,d){
        // http://paulbourke.net/geometry/lineline2d/
        var f = ((d.y - c.y)*(b.x - a.x) - (d.x - c.x)*(b.y - a.y)); 
        if(f === 0){
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
        }else if(arg._isBound){
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
        var disp;
        if(amin + amax < bmin + bmax){
            disp = bmin - amax;
            if(disp >= 0){
                return 0;
            }else{
                return disp;
            }
        }else{
            disp = bmax - amin;
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

})(typeof exports === 'undefined' ? ( this.modula || (this.modula = {})) : exports );

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
        return Math.abs(a-b) <= epsilon;
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
    };
    
    proto.getLocalToDistantMatrix = function(dist){
        //return this.getLocalToWorldMatrix().mult(dist.getWorldToLocalMatrix());
        return dist.getWorldToLocalMatrix().mult(this.getLocalToWorldMatrix()); //FIXME looks fishy ...
    };
    
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
        if(tr.parent !== this){
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

})(typeof exports === 'undefined' ? ( this.modula || (this.modula = {})) : exports );

},{"./Mat3.js":4,"./V2.js":7}],7:[function(require,module,exports){

/* ----- 2D Vectors ----- */

(function(modula){
    "use strict";
    
    function V2(){
        var self = this;
        
        if (!this || this.constructor !== V2){
            self = new V2();
        }
        
        var alen = arguments.length;      
        
        if (alen === 0){
            self.x = 0;
            self.y = 0;
        }else if (alen === 1){
            var arg = arguments[0];
            if(typeof arg === 'number'){
                self.x = arg;
                self.y = arg;
            }else if(arg[0] !== undefined){
                self.x = arg[0] || 0;
                self.y = arg[1] || 0;
            }else{
                self.x = arg.x || 0;
                self.y = arg.y || 0;
            }
        }else if (alen >= 2){
            self.x = arguments[0];
            self.y = arguments[1];
        }
        
        return self;
    }

    modula.V2 = V2;

    var proto = V2.prototype;
    
    V2.zero   = new V2();
    V2.x      = new V2(1,0);
    V2.y      = new V2(0,1);

    var tmp   = new V2();

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
    };

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
    };

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

    proto.neg = function(){
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

})(typeof exports === 'undefined' ? ( this.modula || (this.modula = {})) : exports );


},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9mcmVkL0NvZGUvYmFzdG9zL3NyYy9qcy9iYXN0b3MuanMiLCIvaG9tZS9mcmVkL0NvZGUvYmFzdG9zL3NyYy9qcy9tb2R1bGEvR3JpZDIuanMiLCIvaG9tZS9mcmVkL0NvZGUvYmFzdG9zL3NyYy9qcy9tb2R1bGEvSW5wdXQuanMiLCIvaG9tZS9mcmVkL0NvZGUvYmFzdG9zL3NyYy9qcy9tb2R1bGEvTWF0My5qcyIsIi9ob21lL2ZyZWQvQ29kZS9iYXN0b3Mvc3JjL2pzL21vZHVsYS9SZWN0LmpzIiwiL2hvbWUvZnJlZC9Db2RlL2Jhc3Rvcy9zcmMvanMvbW9kdWxhL1RyYW5zZm9ybTIuanMiLCIvaG9tZS9mcmVkL0NvZGUvYmFzdG9zL3NyYy9qcy9tb2R1bGEvVjIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcDZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKGV4cG9ydHMpe1xuXG4gICAgdmFyIFYyICAgID0gcmVxdWlyZSgnLi9tb2R1bGEvVjIuanMnKS5WMjtcbiAgICB2YXIgUmVjdCAgPSByZXF1aXJlKCcuL21vZHVsYS9SZWN0LmpzJykuUmVjdDtcbiAgICB2YXIgR3JpZDIgPSByZXF1aXJlKCcuL21vZHVsYS9HcmlkMi5qcycpLkdyaWQyO1xuICAgIHZhciBUcmFuc2Zvcm0yID0gcmVxdWlyZSgnLi9tb2R1bGEvVHJhbnNmb3JtMi5qcycpLlRyYW5zZm9ybTI7XG4gICAgdmFyIElucHV0ID0gcmVxdWlyZSgnLi9tb2R1bGEvSW5wdXQuanMnKS5JbnB1dDtcblxuICAgIGZ1bmN0aW9uIGV4dGVuZChrbGFzcyxwYXJlbnRrbGFzcyxhdHRycyl7XG4gICAgICAgIGtsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUocGFyZW50a2xhc3MucHJvdG90eXBlKTtcbiAgICAgICAgZm9yKGF0dHIgaW4gYXR0cnMpe1xuICAgICAgICAgICAga2xhc3MucHJvdG90eXBlW2F0dHJdID0gYXR0cnNbYXR0cl07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBGdWxsc2NyZWVuSGFuZGxlcihvcHRpb25zKXtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICB0aGlzLm5vZGUgPSBvcHRpb25zLm5vZGUgfHwgZG9jdW1lbnQ7XG4gICAgICAgIHRoaXMuaG90a2V5ID0gb3B0aW9ucy5ob3RrZXkgfHwgJ2YnO1xuICAgICAgICB0aGlzLmZ1bGxzY3JlZW4gPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmhhbmRsZXJGdWxsc2NyZWVuID0gZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgaWYoU3RyaW5nLmZyb21DaGFyQ29kZShldmVudC53aGljaCkudG9Mb3dlckNhc2UoKSA9PT0gc2VsZi5ob3RrZXkpe1xuICAgICAgICAgICAgICAgIGlmKCFzZWxmLmZ1bGxzY3JlZW4pe1xuICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm5vZGUud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4pe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2Z1bGxzY3JlZW4gcmVxdWVzdGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm5vZGUud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4oRWxlbWVudC5BTExPV19LRVlCT0FSRF9JTlBVVCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmZ1bGxzY3JlZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Z1bGxzY3JlZW4gbm90IGF2YWlsYWJsZScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgICAgIGlmKHRoaXMuY2FudmFzLndlYmtpdEV4aXRGdWxsc2NyZWVuKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FudmFzLndlYmtpdEV4aXRGdWxsc2NyZWVuKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuaGFuZGxlckZ1bGxzY3JlZW5DaGFuZ2UgPSBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygncG9pbnRlciBsb2NrIHJlcXVlc3RlZCcpO1xuICAgICAgICAgICAgaWYoZG9jdW1lbnQud2Via2l0RnVsbHNjcmVlbkVsZW1lbnQgPSBzZWxmLm5vZGUpe1xuICAgICAgICAgICAgICAgIHNlbGYubm9kZS53ZWJraXRSZXF1ZXN0UG9pbnRlckxvY2soKTtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhYm9ydGVkJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsdGhpcy5oYW5kbGVyRnVsbHNjcmVlbik7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmtpdGZ1bGxzY3JlZW5jaGFuZ2UnLHRoaXMuaGFuZGxlckZ1bGxzY3JlZW5DaGFuZ2UsZmFsc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIE1haW4ob3B0aW9ucyl7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICB0aGlzLmlucHV0ID0gb3B0aW9ucy5pbnB1dDtcbiAgICAgICAgdGhpcy5zY2VuZSA9IG9wdGlvbnMuc2NlbmU7XG4gICAgICAgIHRoaXMucmVuZGVyZXIgID0gbmV3IFJlbmRlcmVyKHttYWluOnRoaXN9KTtcbiAgICAgICAgdGhpcy5ydW5uaW5nICAgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aW1lICAgICAgPSAwO1xuICAgICAgICB0aGlzLmZwcyAgICAgICA9IDYwO1xuICAgICAgICB0aGlzLnNwZWVkICAgICA9IDAuODtcbiAgICAgICAgdGhpcy5kZWx0YVRpbWUgPSAxIC8gdGhpcy5mcHM7XG4gICAgICAgIHRoaXMuY2FudmFzICA9IG9wdGlvbnMuY2FudmFzO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpOyBcbiAgICAgICAgdGhpcy53aWR0aCAgID0gdGhpcy5jYW52YXMud2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ICA9IHRoaXMuY2FudmFzLmhlaWdodDtcbiAgICAgICAgdGhpcy5zY2FsZSAgID0gMTtcbiAgICAgICAgdGhpcy5wb3MgICAgID0gVjIoKTtcbiAgICAgICAgdGhpcy5mdWxsc2NyZWVuID0gbmV3IEZ1bGxzY3JlZW5IYW5kbGVyKHtub2RlOnRoaXMuY2FudmFzLCBob3RrZXk6J2YnfSk7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB9XG5cbiAgICBNYWluLnByb3RvdHlwZSA9IHtcbiAgICAgICAgZXhpdDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuICAgICAgICB9LFxuICAgICAgICBzdGFydDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIGlmKHRoaXMucnVubmluZyl7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMudGltZSA9IDA7XG4gICAgICAgICAgICB2YXIgIHRpbWUgPSAwO1xuICAgICAgICAgICAgZnVuY3Rpb24gbG9vcCgpe1xuICAgICAgICAgICAgICAgIGlmKCFzZWxmLnJ1bm5pbmcpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShsb29wKTtcbiAgICAgICAgICAgICAgICB2YXIgbm93ID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICBpZighdGltZSl7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGVsdGFUaW1lID0gMS9zZWxmLmZwcztcbiAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kZWx0YVRpbWUgPSAobm93IC0gdGltZSkqMC4wMDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNlbGYuZGVsdGFUaW1lICo9IHNlbGYuc3BlZWQ7XG4gICAgICAgICAgICAgICAgdGltZSA9IG5vdyA7XG4gICAgICAgICAgICAgICAgc2VsZi51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICBzZWxmLnRpbWUgKz0gc2VsZi5kZWx0YVRpbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb29wKCk7XG4gICAgICAgIH0sXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHRoaXMuaW5wdXQudXBkYXRlKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBzdHlsZSAgPSBnZXRDb21wdXRlZFN0eWxlKHRoaXMuY2FudmFzKTtcbiAgICAgICAgICAgIHRoaXMud2lkdGggID0gcGFyc2VJbnQoc3R5bGUud2lkdGgpO1xuICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSBwYXJzZUludChzdHlsZS5oZWlnaHQpO1xuICAgICAgICAgICAgdGhpcy5jYW52YXMud2lkdGggID0gdGhpcy53aWR0aDtcbiAgICAgICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHRoaXMuaGVpZ2h0O1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnNhdmUoKTtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC50cmFuc2xhdGUoTWF0aC5mbG9vcih0aGlzLndpZHRoLzIpLE1hdGguZmxvb3IodGhpcy5oZWlnaHQvMikpO1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnNjYWxlKDEvdGhpcy5zY2FsZSwgMS90aGlzLnNjYWxlKTtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC50cmFuc2xhdGUoLXRoaXMucG9zLngsLXRoaXMucG9zLnkpO1xuXG4gICAgICAgICAgICB0aGlzLnNjZW5lLm1haW4gPSB0aGlzO1xuICAgICAgICAgICAgaWYoIXRoaXMuc2NlbmUuc3RhcnRlZCl7XG4gICAgICAgICAgICAgICAgdGhpcy5zY2VuZS5zdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnNjZW5lLnN0YXJ0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNjZW5lLnVwZGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnJlc3RvcmUoKTtcbiAgICAgICAgfSxcbiAgICAgICAgbW91c2U6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcG9zID0gdGhpcy5pbnB1dC5wb3M7XG4gICAgICAgICAgICBwb3MgPSBwb3Muc3ViKFYyKHRoaXMud2lkdGgsdGhpcy5oZWlnaHQpLnNjYWxlKDAuNSkpO1xuICAgICAgICAgICAgcG9zID0gcG9zLmFkZCh0aGlzLnBvcyk7XG4gICAgICAgICAgICByZXR1cm4gcG9zO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gUmVuZGVyZXIob3B0aW9ucyl7XG4gICAgICAgIHRoaXMubWFpbiA9IG9wdGlvbnMubWFpbjtcbiAgICB9XG4gICAgUmVuZGVyZXIucHJvdG90eXBlID0ge1xuICAgICAgICBjb2xvcjogZnVuY3Rpb24oY29sb3Ipe1xuICAgICAgICAgICAgdmFyIGN0eCA9IHRoaXMubWFpbi5jb250ZXh0O1xuICAgICAgICAgICAgY3R4LnNldEZpbGxDb2xvcihjb2xvcik7XG4gICAgICAgICAgICBjdHguc2V0U3Ryb2tlQ29sb3IoY29sb3IpO1xuICAgICAgICB9LFxuICAgICAgICBsaW5lOiBmdW5jdGlvbihzeCxzeSxleCxleSl7XG4gICAgICAgICAgICB2YXIgY3R4ID0gdGhpcy5tYWluLmNvbnRleHQ7XG4gICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICBjdHgubW92ZVRvKHN4LHN5KTtcbiAgICAgICAgICAgIGN0eC5saW5lVG8oZXgsZXkpO1xuICAgICAgICAgICAgY3R4LnN0cm9rZSgpO1xuICAgICAgICB9LFxuICAgICAgICBjaXJjbGU6IGZ1bmN0aW9uKGN4LCBjeSwgcmFkaXVzKXtcbiAgICAgICAgICAgIHZhciBjdHggPSB0aGlzLm1haW4uY29udGV4dDtcbiAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIGN0eC5hcmMoY3gsY3kscmFkaXVzLDAsMipNYXRoLlBJKTtcbiAgICAgICAgICAgIGN0eC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgIGN0eC5zdHJva2UoKTtcbiAgICAgICAgfSxcbiAgICAgICAgZGlzYzogZnVuY3Rpb24oY3gsIGN5LCByYWRpdXMpe1xuICAgICAgICAgICAgdmFyIGN0eCA9IHRoaXMubWFpbi5jb250ZXh0O1xuICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgY3R4LmFyYyhjeCxjeSxyYWRpdXMsMCwyKk1hdGguUEkpO1xuICAgICAgICAgICAgY3R4LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgY3R4LmZpbGwoKTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVjdDogZnVuY3Rpb24oY3gsY3ksc3gsc3kpe1xuICAgICAgICAgICAgdmFyIGN0eCA9IHRoaXMubWFpbi5jb250ZXh0O1xuICAgICAgICAgICAgY3R4LmZpbGxSZWN0KGN4IC0gTWF0aC5mbG9vcihzeC8yKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBjeSAtIE1hdGguZmxvb3Ioc3kvMiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgc3gsIHN5KTtcbiAgICAgICAgfSxcbiAgICAgICAgYm94OiBmdW5jdGlvbihjeCxjeSxzeCxzeSl7XG4gICAgICAgICAgICB2YXIgY3R4ID0gdGhpcy5tYWluLmNvbnRleHQ7XG4gICAgICAgICAgICBjdHguc3Ryb2tlUmVjdChjeCAtIE1hdGguZmxvb3Ioc3gvMiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBjeSAtIE1hdGguZmxvb3Ioc3kvMiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBzeCwgc3kpO1xuICAgICAgICB9LFxuICAgIH1cblxuICAgIC8qIC0tLS0tLS0tIFBST0pFQ1RJTEVTIC0tLS0tLS0tLSAqL1xuXG4gICAgZnVuY3Rpb24gUHJvamVjdGlsZShwb3MsZGlyKXtcbiAgICAgICAgdGhpcy5tYWluID0gbnVsbDtcbiAgICAgICAgdGhpcy5nYW1lID0gbnVsbDtcbiAgICAgICAgdGhpcy5wb3MgID0gVjIocG9zKTtcbiAgICAgICAgdGhpcy5kaXIgID0gZGlyO1xuICAgICAgICB0aGlzLnNwZWVkID0gdGhpcy5kaXIuc2V0TGVuKHRoaXMubWF4U3BlZWQpO1xuICAgICAgICB0aGlzLmRlc3Ryb3llZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIFByb2plY3RpbGUucHJvdG90eXBlID0ge1xuICAgICAgICBtYXhTcGVlZDogOTUwLFxuICAgICAgICBsaWZldGltZTogMS4wLFxuICAgICAgICB3YWxsRGFtYWdlOiAwLjEsXG4gICAgICAgIGVuZW15RGFtYWdlOiAxLFxuICAgICAgICBhdHRhY2s6IGZ1bmN0aW9uKGVuZW15KXtcbiAgICAgICAgICAgIGVuZW15LnRha2VEYW1hZ2UodGhpcy5lbmVteURhbWFnZSk7XG4gICAgICAgICAgICB0aGlzLmRlc3Ryb3llZCA9IHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIGRhbWFnZVdhbGw6ZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciBncmlkID0gdGhpcy5nYW1lLndvcmxkLmdyaWQ7XG4gICAgICAgICAgICB2YXIgY2VsbCA9IGdyaWQuZ2V0Q2VsbEF0UGl4ZWwodGhpcy5wb3MueCx0aGlzLnBvcy55KTsgXG4gICAgICAgICAgICBpZihjZWxsKXtcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSAtTWF0aC5tYXgoMCxNYXRoLmFicyhjZWxsLmNlbGwpLXRoaXMud2FsbERhbWFnZSk7IC8vIGZsaXBwZWQgdG8gaW5kaWNhdGUgZGFtYWdlXG4gICAgICAgICAgICAgICAgZ3JpZC5zZXRDZWxsKGNlbGwueCxjZWxsLnksdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB0aGlzLnBvcyA9IHRoaXMucG9zLmFkZFNjYWxlZCh0aGlzLnNwZWVkLHRoaXMubWFpbi5kZWx0YVRpbWUpO1xuICAgICAgICAgICAgaWYodGhpcy5tYWluLnRpbWUgPiB0aGlzLmxpZmV0aW1lKXtcbiAgICAgICAgICAgICAgICB0aGlzLmRlc3Ryb3llZCA9IHRydWU7XG4gICAgICAgICAgICB9ZWxzZSBpZiggdGhpcy5nYW1lLmdyaWQuY29sbGlzaW9uVmVjdG9yKCAgXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcy54LTEsdGhpcy5wb3MueS0xLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3MueCsxLHRoaXMucG9zLnkrMSAgICkpe1xuICAgICAgICAgICAgICAgIHRoaXMuZGFtYWdlV2FsbCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGVzdHJveWVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVuZGVyOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHIgPSB0aGlzLm1haW4ucmVuZGVyZXI7XG4gICAgICAgICAgICByLmNvbG9yKCd3aGl0ZScpO1xuICAgICAgICAgICAgci5saW5lKCAwLDAsIC0gdGhpcy5kaXIueCAqIDIwLFxuICAgICAgICAgICAgICAgICAgICAgICAgIC0gdGhpcy5kaXIueSAqIDIwICk7XG4gICAgICAgIH0sXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gTGFzZXJQcm9qZWN0aWxlKHBvcyxkaXIpe1xuICAgICAgICBQcm9qZWN0aWxlLmNhbGwodGhpcyxwb3MsZGlyKTtcbiAgICAgICAgdGhpcy5sZW5ndGggPSAxNSArIE1hdGgucmFuZG9tKCkqMjA7XG4gICAgfVxuXG4gICAgZXh0ZW5kKExhc2VyUHJvamVjdGlsZSwgUHJvamVjdGlsZSwge1xuICAgICAgICBtYXhTcGVlZDogOTUwLFxuICAgICAgICBsaWZldGltZTogMyxcbiAgICAgICAgd2FsbERhbWFnZTogMC4wMjUsXG4gICAgICAgIGVuZW15RGFtYWdlOiAyLFxuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBpZih0aGlzLm1haW4udGltZSA+IHRoaXMubGlmZXRpbWUpe1xuICAgICAgICAgICAgICAgIHRoaXMuZGVzdHJveWVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZighdGhpcy5zdHVjayl7XG4gICAgICAgICAgICAgICAgdGhpcy5wb3MgPSB0aGlzLnBvcy5hZGRTY2FsZWQodGhpcy5zcGVlZCx0aGlzLm1haW4uZGVsdGFUaW1lKTtcbiAgICAgICAgICAgICAgICBpZiggdGhpcy5nYW1lLmdyaWQuY29sbGlzaW9uVmVjdG9yKCAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3MueC0xLHRoaXMucG9zLnktMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcy54KzEsdGhpcy5wb3MueSsxICAgKSl7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGFtYWdlV2FsbCgpO1xuICAgICAgICAgICAgICAgICAgICBpZihNYXRoLnJhbmRvbSgpIDwgMC4wNSl7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0dWNrID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGlmZXRpbWUgKz0gTWF0aC5yYW5kb20oKSozO1xuICAgICAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGVzdHJveWVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVuZGVyOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHIgPSB0aGlzLm1haW4ucmVuZGVyZXI7XG4gICAgICAgICAgICB2YXIgbCA9IHRoaXMubGVuZ3RoO1xuICAgICAgICAgICAgci5jb2xvcignI0ZGMDBGRicpO1xuICAgICAgICAgICAgci5saW5lKCB0aGlzLmRpci54ICogbCwgIHRoaXMuZGlyLnkgKiBsLFxuICAgICAgICAgICAgICAgICAgICAtdGhpcy5kaXIueCAqIGwsIC10aGlzLmRpci55ICogbCk7XG4gICAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBHcnVudFByb2plY3RpbGUocG9zLGRpcil7XG4gICAgICAgIFByb2plY3RpbGUuY2FsbCh0aGlzLHBvcyxkaXIpO1xuICAgIH1cblxuICAgIGV4dGVuZChHcnVudFByb2plY3RpbGUsIFByb2plY3RpbGUsIHtcbiAgICAgICAgbWF4U3BlZWQ6IDE1MCxcbiAgICAgICAgbGlmZXRpbWU6IDUsXG4gICAgICAgIHdhbGxEYW1hZ2U6IDAuMDI1LFxuICAgICAgICByZW5kZXI6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgciA9IHRoaXMubWFpbi5yZW5kZXJlcjtcbiAgICAgICAgICAgIHIuY29sb3IoJ3JlZCcpO1xuICAgICAgICAgICAgci5kaXNjKCAwLDAsMyk7XG4gICAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBTb2xkaWVyUHJvamVjdGlsZShwb3MsZGlyKXtcbiAgICAgICAgUHJvamVjdGlsZS5jYWxsKHRoaXMscG9zLGRpcik7XG4gICAgfVxuXG4gICAgZXh0ZW5kKFNvbGRpZXJQcm9qZWN0aWxlLCBQcm9qZWN0aWxlLCB7XG4gICAgICAgIG1heFNwZWVkOiAyNTAsXG4gICAgICAgIGxpZmV0aW1lOiA1LFxuICAgICAgICB3YWxsRGFtYWdlOiAxLFxuICAgICAgICByZW5kZXI6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgciA9IHRoaXMubWFpbi5yZW5kZXJlcjtcbiAgICAgICAgICAgIHIuY29sb3IoJ2dyZWVuJyk7XG4gICAgICAgICAgICByLmRpc2MoIDAsMCw0KTtcbiAgICAgICAgICAgIHIuY2lyY2xlKCAwLDAsNik7XG4gICAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvKiAtLS0tLS0tLSBQTEFZRVIgV0VBUE9OUyAtLS0tLS0tLS0gKi9cblxuICAgIGZ1bmN0aW9uIFdlYXBvbihvcHRpb25zKXtcbiAgICAgICAgdGhpcy5wbGF5ZXIgPSBvcHRpb25zLnBsYXllcjtcbiAgICAgICAgdGhpcy5tYWluID0gb3B0aW9ucy5wbGF5ZXIubWFpbjtcbiAgICAgICAgdGhpcy5nYW1lID0gb3B0aW9ucy5wbGF5ZXIubWFpbi5zY2VuZTtcbiAgICAgICAgdGhpcy5maXJlVGltZSA9IDA7XG4gICAgfVxuXG4gICAgV2VhcG9uLnByb3RvdHlwZSA9IHtcbiAgICAgICAgZmlyZUludGVydmFsOiAwLjAyNSxcbiAgICAgICAgcHJvamVjdGlsZTogUHJvamVjdGlsZSxcbiAgICAgICAgZmlyZTogZnVuY3Rpb24oYWltKXtcbiAgICAgICAgICAgIGlmKHRoaXMubWFpbi50aW1lID4gdGhpcy5maXJlVGltZSl7XG4gICAgICAgICAgICAgICAgdmFyIHNwcmVhZCA9IE1hdGgubWF4KDAuMDIsTWF0aC5taW4oMC41LCAwLjUvKDErTWF0aC5tYXgoMCwtMC40KzAuMDI1KnRoaXMubWFpbi5tb3VzZSgpLnN1Yih0aGlzLnBsYXllci5wb3MpLmxlbigpKSkpKVxuICAgICAgICAgICAgICAgIHZhciBkaXIgPSBhaW0uYWRkKFYyLnJhbmRvbURpc2MoKS5zY2FsZShzcHJlYWQpKS5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWUuYWRkUGxheWVyUHJvaihuZXcgdGhpcy5wcm9qZWN0aWxlKHRoaXMucGxheWVyLnBvcy5hZGQoZGlyLnNjYWxlKDEwKSksZGlyKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlVGltZSA9IHRoaXMubWFpbi50aW1lICsgdGhpcy5maXJlSW50ZXJ2YWw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gTGFzZXJzKG9wdGlvbnMpe1xuICAgICAgICBXZWFwb24uY2FsbCh0aGlzLG9wdGlvbnMpO1xuICAgICAgICB0aGlzLnNlcXVlbmNlID0gMDtcbiAgICB9XG5cbiAgICBleHRlbmQoTGFzZXJzLCBXZWFwb24sIHtcbiAgICAgICAgZmlyZUludGVydmFsOiAwLjAyNSxcbiAgICAgICAgcHJvamVjdGlsZTogTGFzZXJQcm9qZWN0aWxlLFxuICAgICAgICBmaXJlOiBmdW5jdGlvbihhaW0pe1xuICAgICAgICAgICAgaWYodGhpcy5tYWluLnRpbWUgPiB0aGlzLmZpcmVUaW1lKXtcbiAgICAgICAgICAgICAgICB2YXIgc3ByZWFkID0gTWF0aC5tYXgoMC4wMixNYXRoLm1pbigwLjUsIDAuNS8oMStNYXRoLm1heCgwLC0wLjQrMC4wMjUqdGhpcy5tYWluLm1vdXNlKCkuc3ViKHRoaXMucGxheWVyLnBvcykubGVuKCkpKSkpXG4gICAgICAgICAgICAgICAgdmFyIGRpciA9IGFpbS5hZGQoVjIucmFuZG9tRGlzYygpLnNjYWxlKHNwcmVhZCkpLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZS5hZGRQbGF5ZXJQcm9qKG5ldyB0aGlzLnByb2plY3RpbGUodGhpcy5wbGF5ZXIucG9zLmFkZChkaXIuc2NhbGUoMTApKSxkaXIpKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmVUaW1lID0gdGhpcy5tYWluLnRpbWUgKyB0aGlzLmZpcmVJbnRlcnZhbDtcbiAgICAgICAgICAgICAgICB0aGlzLnNlcXVlbmNlKys7XG4gICAgICAgICAgICAgICAgaWYodGhpcy5zZXF1ZW5jZSAlIDUgPT09IDApe1xuICAgICAgICAgICAgICAgICAgICB2YXIgZW5lbWllcyA9IHRoaXMuZ2FtZS5lbmVtaWVzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0cyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSBlbmVtaWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGVuZW1pZXNbaV0ucG9zLmRpc3RTcSh0aGlzLnBsYXllci5wb3MpIDwgOTAwMDApe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldHMucHVzaChlbmVtaWVzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IE1hdGgubWluKDUsdGFyZ2V0cy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgciA9IDUgLSBjO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZShjLS0gPiAwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKnRhcmdldHMubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSB0YXJnZXRzLnNwbGljZShNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqdGFyZ2V0cy5sZW5ndGgpLDEpWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRpciA9IHRhcmdldC5wb3Muc3ViKHRoaXMucGxheWVyLnBvcykuYWRkU2NhbGVkKFYyLnJhbmRvbURpc2MoKSwzMCkubm9ybWFsaXplKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWUuYWRkUGxheWVyUHJvaihuZXcgdGhpcy5wcm9qZWN0aWxlKHRoaXMucGxheWVyLnBvcy5hZGQoZGlyLnNjYWxlKDEwKSksZGlyKSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlKHItLSA+IDApe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRpciA9IFYyLnJhbmRvbURpc2MoKS5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZS5hZGRQbGF5ZXJQcm9qKG5ldyB0aGlzLnByb2plY3RpbGUodGhpcy5wbGF5ZXIucG9zLmFkZChkaXIuc2NhbGUoMTApKSxkaXIpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvKiAtLS0tLS0tLSBFTlRJVFkgLS0tLS0tLS0tICovXG5cbiAgICBmdW5jdGlvbiBFbnRpdHkob3B0aW9ucyl7XG4gICAgICAgIHRoaXMubWFpbiAgPSBvcHRpb25zLm1haW47XG4gICAgICAgIHRoaXMuZ2FtZSAgPSBvcHRpb25zLm1haW4uc2NlbmU7XG4gICAgICAgIHRoaXMucG9zICAgPSBWMigpO1xuICAgICAgICB0aGlzLnNwZWVkID0gVjIoKTtcbiAgICAgICAgdGhpcy5oZWFsdGggPSB0aGlzLm1heEhlYWx0aDtcbiAgICAgICAgdGhpcy5kZXN0cm95ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zdGFydGVkICAgPSBmYWxzZTtcbiAgICAgICAgaWYodGhpcy5yYWRpdXMpe1xuICAgICAgICAgICAgdGhpcy5zcVJhZGl1cyA9IHRoaXMucmFkaXVzKnRoaXMucmFkaXVzO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgRW50aXR5LnByb3RvdHlwZSA9IHtcbiAgICAgICAgbWF4SGVhbHRoOiAxLFxuICAgICAgICB0YWtlRGFtYWdlOiBmdW5jdGlvbihkYW1hZ2Upe1xuICAgICAgICAgICAgdGhpcy5oZWFsdGggLT0gZGFtYWdlO1xuICAgICAgICAgICAgaWYodGhpcy5oZWFsdGggPD0gMCl7XG4gICAgICAgICAgICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGRhbWFnZUNlbGw6IGZ1bmN0aW9uKHgseSxkYW1hZ2Upe1xuICAgICAgICAgICAgdmFyIGdyaWQgPSB0aGlzLmdhbWUud29ybGQuZ3JpZDtcbiAgICAgICAgICAgIHZhciBjZWxsID0gZ3JpZC5nZXRDZWxsKHgseSk7XG4gICAgICAgICAgICBpZihjZWxsKXtcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSAtTWF0aC5tYXgoMCxNYXRoLmFicyhjZWxsKS1kYW1hZ2UpOyAvLyBmbGlwcGVkIHRvIGluZGljYXRlIGRhbWFnZVxuICAgICAgICAgICAgICAgIGdyaWQuc2V0Q2VsbCh4LHksdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBkZXN0cm95OiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdGhpcy5kZXN0cm95ZWQgPSB0cnVlO1xuICAgICAgICB9LFxuICAgIH07XG5cblxuICAgIC8qIC0tLS0tLS0tIFBMQVlFUiAtLS0tLS0tLS0gKi9cblxuICAgIGZ1bmN0aW9uIFBsYXllcihvcHRpb25zKXtcbiAgICAgICAgRW50aXR5LmNhbGwodGhpcyxvcHRpb25zKTtcbiAgICAgICAgdGhpcy5jcG9zICA9IFYyKCk7XG4gICAgICAgIHRoaXMud2VhcG9ucyA9IHtcbiAgICAgICAgICAgICdkZWZhdWx0JzpuZXcgV2VhcG9uKHtwbGF5ZXI6dGhpc30pLFxuICAgICAgICAgICAgJ2xhc2Vycyc6IG5ldyBMYXNlcnMoe3BsYXllcjp0aGlzfSksXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMud2VhcG9uID0gdGhpcy53ZWFwb25zLmRlZmF1bHQ7XG4gICAgfVxuXG4gICAgZXh0ZW5kKFBsYXllcixFbnRpdHkse1xuICAgICAgICByYWRpdXM6IDEwLFxuICAgICAgICBtYXhTcGVlZDogMTUwLFxuICAgICAgICB3YWxsRGFtYWdlOiAwLjA1LFxuICAgICAgICB0YWtlRGFtYWdlOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdGhpcy5nYW1lLnJlc3RhcnQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgZGFtYWdlV2FsbDpmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIGdyaWQgPSB0aGlzLmdhbWUud29ybGQuZ3JpZDtcbiAgICAgICAgICAgIHZhciBpbmN4ID0gKHRoaXMuc3BlZWQueCA+IDApID8gMSA6ICh0aGlzLnNwZWVkLnggPCAwID8gLTEgOiAwKSA7XG4gICAgICAgICAgICB2YXIgaW5jeSA9ICh0aGlzLnNwZWVkLnkgPiAwKSA/IDEgOiAodGhpcy5zcGVlZC55IDwgMCA/IC0xIDogMCkgO1xuICAgICAgICAgICAgdmFyIGNlbGwgPSBncmlkLmdldENlbGxBdFBpeGVsKHRoaXMucG9zLngsIHRoaXMucG9zLnkpO1xuICAgICAgICAgICAgdmFyIGNlbGxzID0gW11cbiAgICAgICAgICAgIGlmKGNlbGwpe1xuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhpbmN4KStNYXRoLmFicyhpbmN5KSA9PSAxKXtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kYW1hZ2VDZWxsKGNlbGwueCtpbmN4LGNlbGwueStpbmN5LHRoaXMud2FsbERhbWFnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfWVsc2UgaWYgKE1hdGguYWJzKGluY3gpK01hdGguYWJzKGluY3kpID09IDIpe1xuICAgICAgICAgICAgICAgIHRoaXMuZGFtYWdlQ2VsbChjZWxsLngraW5jeCxjZWxsLnksdGhpcy53YWxsRGFtYWdlLzIpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGFtYWdlQ2VsbChjZWxsLngsY2VsbC55K2luY3ksdGhpcy53YWxsRGFtYWdlLzIpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGFtYWdlQ2VsbChjZWxsLngraW5jeCxjZWxsLnkraW5jeSx0aGlzLndhbGxEYW1hZ2UvMyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHNldFBvczogZnVuY3Rpb24ocG9zKXtcbiAgICAgICAgICAgIHRoaXMucG9zID0gcG9zLmNvcHkoKTtcbiAgICAgICAgICAgIHRoaXMuY3BvcyA9IHBvcy5jb3B5KCk7XG4gICAgICAgICAgICB0aGlzLm1haW4ucG9zID0gcG9zLmNvcHkoKTtcbiAgICAgICAgfSxcbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIGlucHV0ID0gdGhpcy5tYWluLmlucHV0O1xuXG5cbiAgICAgICAgICAgIGlmKGlucHV0LmRvd24oJ2QnKSl7XG4gICAgICAgICAgICAgICAgdGhpcy5zcGVlZC54ID0gdGhpcy5tYXhTcGVlZDtcbiAgICAgICAgICAgIH1lbHNlIGlmKGlucHV0LmRvd24oJ2EnKSl7XG4gICAgICAgICAgICAgICAgdGhpcy5zcGVlZC54ID0gLXRoaXMubWF4U3BlZWQ7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICB0aGlzLnNwZWVkLnggPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoaW5wdXQuZG93bigndycpKXtcbiAgICAgICAgICAgICAgICB0aGlzLnNwZWVkLnkgPSAtdGhpcy5tYXhTcGVlZDtcbiAgICAgICAgICAgIH1lbHNlIGlmKGlucHV0LmRvd24oJ3MnKSl7XG4gICAgICAgICAgICAgICAgdGhpcy5zcGVlZC55ID0gdGhpcy5tYXhTcGVlZDtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIHRoaXMuc3BlZWQueSA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMucG9zID0gdGhpcy5wb3MuYWRkU2NhbGVkKHRoaXMuc3BlZWQsdGhpcy5tYWluLmRlbHRhVGltZSk7XG5cbiAgICAgICAgICAgIGlmKHRoaXMuc3BlZWQubGVuKCkpe1xuICAgICAgICAgICAgICAgIHZhciBhcG9zID0gdGhpcy5wb3MuYWRkKHRoaXMuc3BlZWQuc2V0TGVuKDQwMCkpO1xuICAgICAgICAgICAgICAgIHRoaXMuY3BvcyA9IHRoaXMuY3Bvcy5sZXJwKGFwb3MsdGhpcy5tYWluLmRlbHRhVGltZSoxLjUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgIGNvbGxpc2lvbiA9IHRoaXMuZ2FtZS5ncmlkLmNvbGxpc2lvblZlY3RvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3MueCAtIDEwLCB0aGlzLnBvcy55IC0gMTAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9zLnggKyAxMCwgdGhpcy5wb3MueSArIDEwICk7XG5cbiAgICAgICAgICAgIGlmKGlucHV0LmRvd24oJ3AnKSl7XG4gICAgICAgICAgICAgICAgdGhpcy5tYWluLmV4aXQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5haW0gPSB0aGlzLm1haW4ubW91c2UoKS5zdWIodGhpcy5wb3MpLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgaWYoaW5wdXQuZG93bignbW91c2UwJykpe1xuICAgICAgICAgICAgICAgIHRoaXMud2VhcG9uLmZpcmUodGhpcy5haW0pO1xuICAgICAgICAgICAgICAgIHRoaXMuZGFtYWdlV2FsbCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZihjb2xsaXNpb24pe1xuICAgICAgICAgICAgICAgIHRoaXMucG9zID0gdGhpcy5wb3MuYWRkKGNvbGxpc2lvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBjY2VudGVyID0gdGhpcy5jcG9zLmxlcnAodGhpcy5tYWluLm1vdXNlKCksMC4zKSBcbiAgICAgICAgICAgIHZhciBkaXN0ID0gdGhpcy5tYWluLnBvcy5zdWIoY2NlbnRlcik7XG4gICAgICAgICAgICBpZiAgKGRpc3QubGVuKCkgPiAxMCl7XG4gICAgICAgICAgICAgICAgZGlzdCA9IGRpc3QubGVycChkaXN0LnNjYWxlKDAuMSksdGhpcy5tYWluLmRlbHRhVGltZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5tYWluLnBvcyA9IGNjZW50ZXIuYWRkKGRpc3QpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0sXG4gICAgICAgIHJlbmRlcjogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByID0gdGhpcy5tYWluLnJlbmRlcmVyO1xuICAgICAgICAgICAgci5jb2xvcignYmx1ZScpO1xuICAgICAgICAgICAgci5jaXJjbGUoMCwwLHRoaXMucmFkaXVzKTtcbiAgICAgICAgICAgIHIubGluZSh0aGlzLmFpbS54KjMsdGhpcy5haW0ueSozLHRoaXMuYWltLngqMTgsdGhpcy5haW0ueSoxOCk7XG5cbiAgICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8qIC0tLS0tLS0tIEVOTkVNSUVTIC0tLS0tLS0tLSAqL1xuXG4gICAgZnVuY3Rpb24gR3J1bnQob3B0aW9ucyl7XG4gICAgICAgIEVudGl0eS5jYWxsKHRoaXMsb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuc3BlZWQgPSBWMi5yYW5kb21EaXNjKCkuc2V0TGVuKHRoaXMubWF4U3BlZWQpO1xuICAgICAgICB0aGlzLmFpbSAgID0gdGhpcy5zcGVlZC5ub3JtYWxpemUoKTtcbiAgICAgICAgdGhpcy50aW1lb3V0ID0gMDtcbiAgICAgICAgdGhpcy5maXJlVGltZSA9IDA7XG4gICAgICAgIHRoaXMuZmlyZVNlcXVlbmNlID0gMTtcbiAgICAgICAgdGhpcy5wcm9qZWN0aWxlcyA9IFtdO1xuICAgICAgICB0aGlzLndhcm11cCA9IDA7XG4gICAgICAgIHRoaXMubXl0aG9zaXNUaW1lID0gLTE7XG4gICAgfVxuXG4gICAgZXh0ZW5kKEdydW50LCBFbnRpdHksIHtcbiAgICAgICAgcmFkaXVzOiAxMixcbiAgICAgICAgZmlyZUludGVydmFsOiAwLjEsXG4gICAgICAgIG1heFNwZWVkOiA2MCxcbiAgICAgICAgcmFkaXVzOiAxMixcbiAgICAgICAgdGFrZURhbWFnZTogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHRoaXMuZGVzdHJveWVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLnByb2plY3RpbGVzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB0aGlzLnByb2plY3RpbGVzW2ldLmRlc3Ryb3llZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGlmKCF0aGlzLnRpbWVvdXQpe1xuICAgICAgICAgICAgICAgIHRoaXMudGltZW91dCA9IHRoaXMubWFpbi50aW1lICsgMC41ICsgTWF0aC5yYW5kb20oKSoyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoIXRoaXMud2FybXVwKXtcbiAgICAgICAgICAgICAgICB0aGlzLndhcm11cCAgPSB0aGlzLm1haW4udGltZSArIDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih0aGlzLm15dGhvc2lzVGltZSA+IDAgJiYgdGhpcy5teXRob3Npc1RpbWUgPCB0aGlzLm1haW4udGltZSl7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lLmFkZEVuZW15KG5ldyBHcnVudCh7cG9zOnRoaXMucG9zfSkpOyBcbiAgICAgICAgICAgICAgICB0aGlzLm15dGhvc2lzVGltZSA9IC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5wb3MgPSB0aGlzLnBvcy5hZGRTY2FsZWQodGhpcy5zcGVlZCx0aGlzLm1haW4uZGVsdGFUaW1lKTtcblxuICAgICAgICAgICAgdmFyIGNvbGxpc2lvbiA9IHRoaXMuZ2FtZS5ncmlkLmNvbGxpc2lvblZlY3RvciggIFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3MueC10aGlzLnJhZGl1cyx0aGlzLnBvcy55LXRoaXMucmFkaXVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3MueCt0aGlzLnJhZGl1cyx0aGlzLnBvcy55K3RoaXMucmFkaXVzICAgKTtcbiAgICAgICAgICAgIGlmKGNvbGxpc2lvbil7XG4gICAgICAgICAgICAgICAgdGhpcy5wb3MgPSB0aGlzLnBvcy5hZGQoY29sbGlzaW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbGxpc2lvbiB8fCB0aGlzLnRpbWVvdXQgPCB0aGlzLm1haW4udGltZSl7XG4gICAgICAgICAgICAgICAgdmFyIHBsYXllcmJpYXMgPSB0aGlzLmdhbWUucGxheWVyLnBvcy5zdWIodGhpcy5wb3MpLnNldExlbigwLjIpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3BlZWQgPSBWMi5yYW5kb21EaXNjKCkuYWRkKHBsYXllcmJpYXMpLnNldExlbih0aGlzLm1heFNwZWVkKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFpbSAgID0gdGhpcy5zcGVlZC5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnRpbWVvdXQgPSB0aGlzLm1haW4udGltZSArIDAuNSArIE1hdGgucmFuZG9tKCkqMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHRoaXMucG9zLmRpc3RTcSh0aGlzLmdhbWUucGxheWVyLnBvcykgPCA5MDAwMCl7XG4gICAgICAgICAgICAgICAgdGhpcy5haW0gPSB0aGlzLmdhbWUucGxheWVyLnBvcy5zdWIodGhpcy5wb3MpLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgICAgIGlmKHRoaXMud2FybXVwIDwgdGhpcy5tYWluLnRpbWUgJiYgdGhpcy5maXJlVGltZSA8IHRoaXMubWFpbi50aW1lKXtcbiAgICAgICAgICAgICAgICAgICAgaWYodGhpcy5teXRob3Npc1RpbWUgPCAwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubXl0aG9zaXNUaW1lID0gdGhpcy5tYWluLnRpbWUgKyA1O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBwcm9qID0gbmV3IEdydW50UHJvamVjdGlsZSh0aGlzLnBvcyx0aGlzLmFpbSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvamVjdGlsZXMucHVzaChwcm9qKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lLmFkZEVuZW15UHJvaihwcm9qKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maXJlVGltZSA9IHRoaXMubWFpbi50aW1lICsgdGhpcy5maXJlSW50ZXJ2YWw7XG4gICAgICAgICAgICAgICAgICAgIGlmKCEodGhpcy5maXJlU2VxdWVuY2UrKyAlIDUpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmlyZVRpbWUgKz0gMyAqIHRoaXMuZmlyZUludGVydmFsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0sXG4gICAgICAgIHJlbmRlcjogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByID0gdGhpcy5tYWluLnJlbmRlcmVyO1xuICAgICAgICAgICAgci5jb2xvcigncmVkJyk7XG4gICAgICAgICAgICB2YXIgcmFkaXVzID0gdGhpcy5yYWRpdXMgKiAwLjg7XG4gICAgICAgICAgICByLmNpcmNsZSgwLDAscmFkaXVzKTtcbiAgICAgICAgICAgIHIubGluZSggcmFkaXVzKnRoaXMuYWltLnggKiAwLjUsXG4gICAgICAgICAgICAgICAgICAgIHJhZGl1cyp0aGlzLmFpbS55ICogMC41LFxuICAgICAgICAgICAgICAgICAgICByYWRpdXMqdGhpcy5haW0ueCAqIDEuNSxcbiAgICAgICAgICAgICAgICAgICAgcmFkaXVzKnRoaXMuYWltLnkgKiAxLjUpO1xuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gU29sZGllcihvcHRpb25zKXtcbiAgICAgICAgRW50aXR5LmNhbGwodGhpcyxvcHRpb25zKTtcbiAgICAgICAgdGhpcy5zcGVlZCA9IFYyLnJhbmRvbURpc2MoKS5zZXRMZW4odGhpcy5tYXhTcGVlZCk7XG4gICAgICAgIHRoaXMuYWltICAgPSB0aGlzLnNwZWVkLm5vcm1hbGl6ZSgpO1xuICAgICAgICB0aGlzLnJhZGl1cyA9IDE1O1xuICAgICAgICB0aGlzLnNxUmFkaXVzID0gdGhpcy5yYWRpdXMgKiB0aGlzLnJhZGl1cztcbiAgICAgICAgdGhpcy50aW1lb3V0ID0gMDtcbiAgICAgICAgdGhpcy5maXJlVGltZSA9IDA7XG4gICAgICAgIHRoaXMuZmlyZVNlcXVlbmNlID0gMTtcbiAgICAgICAgdGhpcy53YXJtdXAgPSAwO1xuICAgICAgICB0aGlzLmRhbWFnZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBleHRlbmQoU29sZGllciwgRW50aXR5LCB7XG4gICAgICAgIG1heEhlYWx0aDogMTAsXG4gICAgICAgIG1heFNwZWVkOiA2MCxcbiAgICAgICAgZmlyZUludGVydmFsOiAwLjcsXG4gICAgICAgIHRha2VEYW1hZ2U6IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgICAgICAgICBFbnRpdHkucHJvdG90eXBlLnRha2VEYW1hZ2UuY2FsbCh0aGlzLGFtb3VudCk7XG4gICAgICAgICAgICB0aGlzLmRhbWFnZWQgPSB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBpZighdGhpcy50aW1lb3V0KXtcbiAgICAgICAgICAgICAgICB0aGlzLnRpbWVvdXQgPSB0aGlzLm1haW4udGltZSArIDAuOCArIE1hdGgucmFuZG9tKCkqMztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKCF0aGlzLndhcm11cCl7XG4gICAgICAgICAgICAgICAgdGhpcy53YXJtdXAgID0gdGhpcy5tYWluLnRpbWUgKyAyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnBvcyA9IHRoaXMucG9zLmFkZFNjYWxlZCh0aGlzLnNwZWVkLHRoaXMubWFpbi5kZWx0YVRpbWUpO1xuXG4gICAgICAgICAgICB2YXIgY29sbGlzaW9uID0gdGhpcy5nYW1lLmdyaWQuY29sbGlzaW9uVmVjdG9yKCAgXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcy54LXRoaXMucmFkaXVzLHRoaXMucG9zLnktdGhpcy5yYWRpdXMsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcy54K3RoaXMucmFkaXVzLHRoaXMucG9zLnkrdGhpcy5yYWRpdXMgICApO1xuICAgICAgICAgICAgaWYoY29sbGlzaW9uKXtcbiAgICAgICAgICAgICAgICB0aGlzLnBvcyA9IHRoaXMucG9zLmFkZChjb2xsaXNpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoY29sbGlzaW9uIHx8IHRoaXMudGltZW91dCA8IHRoaXMubWFpbi50aW1lKXtcbiAgICAgICAgICAgICAgICB2YXIgcGxheWVyYmlhcyA9IHRoaXMuZ2FtZS5wbGF5ZXIucG9zLnN1Yih0aGlzLnBvcykuc2V0TGVuKDAuMik7XG4gICAgICAgICAgICAgICAgdGhpcy5zcGVlZCA9IFYyLnJhbmRvbURpc2MoKS5hZGQocGxheWVyYmlhcykuc2V0TGVuKHRoaXMubWF4U3BlZWQpO1xuICAgICAgICAgICAgICAgIHRoaXMuYWltICAgPSB0aGlzLnNwZWVkLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMudGltZW91dCA9IHRoaXMubWFpbi50aW1lICsgMC44ICsgTWF0aC5yYW5kb20oKSozO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYodGhpcy5wb3MuZGlzdFNxKHRoaXMuZ2FtZS5wbGF5ZXIucG9zKSA8IDI1MDAwMCl7XG4gICAgICAgICAgICAgICAgdmFyIHBwb3MgPSB0aGlzLmdhbWUucGxheWVyLnBvcztcbiAgICAgICAgICAgICAgICAgICAgcHBvcyA9IHBwb3MuYWRkU2NhbGVkKHRoaXMuZ2FtZS5wbGF5ZXIuc3BlZWQscHBvcy5zdWIodGhpcy5wb3MpLmxlbigpLzI1MCAqICgwLjUrTWF0aC5yYW5kb20oKSowLjI1KSk7XG4gICAgICAgICAgICAgICAgICAgIHBwb3MgPSBwcG9zLmFkZFNjYWxlZChWMi5yYW5kb21EaXNjKCksMjApO1xuICAgICAgICAgICAgICAgIHRoaXMuYWltID0gcHBvcy5zdWIodGhpcy5wb3MpLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgICAgIGlmKHRoaXMud2FybXVwIDwgdGhpcy5tYWluLnRpbWUgJiYgdGhpcy5maXJlVGltZSA8IHRoaXMubWFpbi50aW1lKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByb2ogPSBuZXcgU29sZGllclByb2plY3RpbGUodGhpcy5wb3MsdGhpcy5haW0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWUuYWRkRW5lbXlQcm9qKHByb2opO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpcmVUaW1lID0gdGhpcy5tYWluLnRpbWUgKyB0aGlzLmZpcmVJbnRlcnZhbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSxcbiAgICAgICAgcmVuZGVyOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHIgPSB0aGlzLm1haW4ucmVuZGVyZXI7XG4gICAgICAgICAgICBpZih0aGlzLmRhbWFnZWQpe1xuICAgICAgICAgICAgICAgIHRoaXMuZGFtYWdlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHIuY29sb3IoJ3doaXRlJyk7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICByLmNvbG9yKCdncmVlbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHJhZGl1cyA9IHRoaXMucmFkaXVzICogMC44O1xuICAgICAgICAgICAgci5jaXJjbGUoMCwwLHJhZGl1cyk7XG4gICAgICAgICAgICByLmNpcmNsZSgwLDAscmFkaXVzKzIpO1xuICAgICAgICAgICAgci5saW5lKCByYWRpdXMqdGhpcy5haW0ueCAqIDAuNSxcbiAgICAgICAgICAgICAgICAgICAgcmFkaXVzKnRoaXMuYWltLnkgKiAwLjUsXG4gICAgICAgICAgICAgICAgICAgIHJhZGl1cyp0aGlzLmFpbS54ICogMS41LFxuICAgICAgICAgICAgICAgICAgICByYWRpdXMqdGhpcy5haW0ueSAqIDEuNSk7XG4gICAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBLYW1pa2F6ZShvcHRpb25zKXtcbiAgICAgICAgRW50aXR5LmNhbGwodGhpcyxvcHRpb25zKTtcbiAgICAgICAgdGhpcy5wb3MgPSBvcHRpb25zLnBvcztcbiAgICAgICAgdGhpcy5zcGVlZCA9IFYyLnJhbmRvbURpc2MoKS5zZXRMZW4odGhpcy5tYXhTcGVlZCk7XG4gICAgICAgIHRoaXMudGltZW91dCA9IDA7XG4gICAgICAgIHRoaXMud2FybXVwID0gMDtcbiAgICAgICAgdGhpcy5kYW1hZ2VkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgZXh0ZW5kKEthbWlrYXplLCBFbnRpdHksIHtcbiAgICAgICAgbWF4SGVhbHRoOiAyNSxcbiAgICAgICAgbWF4U3BlZWQ6IDYwLFxuICAgICAgICBjaGFzZVNwZWVkOiAxMjUsXG4gICAgICAgIHJhZGl1czogMTUsXG4gICAgICAgIHdhbGxEYW1hZ2U6IDAuMDM1LFxuICAgICAgICB0YWtlRGFtYWdlOiBmdW5jdGlvbihhbW91bnQpe1xuICAgICAgICAgICAgRW50aXR5LnByb3RvdHlwZS50YWtlRGFtYWdlLmNhbGwodGhpcyxhbW91bnQpO1xuICAgICAgICAgICAgdGhpcy5maXJlVGltZSA9IHRoaXMubWFpbi50aW1lICsgdGhpcy5maXJlSW50ZXJ2YWw7XG4gICAgICAgICAgICB0aGlzLnBvcyA9IHRoaXMucG9zLmFkZFNjYWxlZCh0aGlzLnNwZWVkLHRoaXMubWFpbi5kZWx0YVRpbWUqIC0wLjMpO1xuICAgICAgICAgICAgdGhpcy5kYW1hZ2VkID0gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZGFtYWdlV2FsbDpmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIGdyaWQgPSB0aGlzLmdhbWUud29ybGQuZ3JpZDtcbiAgICAgICAgICAgIGdyaWQucGl4ZWxSZWN0KCB0aGlzLnBvcy54LXRoaXMucmFkaXVzLCB0aGlzLnBvcy55LXRoaXMucmFkaXVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9zLngrdGhpcy5yYWRpdXMsIHRoaXMucG9zLnkrdGhpcy5yYWRpdXMsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24oeCx5LGNlbGwpe1xuICAgICAgICAgICAgICAgICAgICBpZihjZWxsKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IC1NYXRoLm1heCgwLE1hdGguYWJzKGNlbGwpLXNlbGYud2FsbERhbWFnZSk7IC8vIGZsaXBwZWQgdG8gaW5kaWNhdGUgZGFtYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICBncmlkLnNldENlbGwoeCx5LHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBpZighdGhpcy50aW1lb3V0KXtcbiAgICAgICAgICAgICAgICB0aGlzLnRpbWVvdXQgPSB0aGlzLm1haW4udGltZSArIDAuOCArIE1hdGgucmFuZG9tKCkqMztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKCF0aGlzLndhcm11cCl7XG4gICAgICAgICAgICAgICAgdGhpcy53YXJtdXAgID0gdGhpcy5tYWluLnRpbWUgKyAyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnBvcyA9IHRoaXMucG9zLmFkZFNjYWxlZCh0aGlzLnNwZWVkLHRoaXMubWFpbi5kZWx0YVRpbWUpO1xuXG4gICAgICAgICAgICB2YXIgY29sbGlzaW9uID0gdGhpcy5nYW1lLmdyaWQuY29sbGlzaW9uVmVjdG9yKCAgXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcy54LXRoaXMucmFkaXVzLHRoaXMucG9zLnktdGhpcy5yYWRpdXMsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcy54K3RoaXMucmFkaXVzLHRoaXMucG9zLnkrdGhpcy5yYWRpdXMgICApO1xuICAgICAgICAgICAgaWYoY29sbGlzaW9uKXtcbiAgICAgICAgICAgICAgICB0aGlzLmRhbWFnZVdhbGwoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBvcyA9IHRoaXMucG9zLmFkZChWMihjb2xsaXNpb24pLnNldExlbig1KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZighdGhpcy5jaGFzaW5nICYmIChjb2xsaXNpb24gfHwgdGhpcy50aW1lb3V0IDwgdGhpcy5tYWluLnRpbWUpKXtcbiAgICAgICAgICAgICAgICB2YXIgcGxheWVyYmlhcyA9IHRoaXMuZ2FtZS5wbGF5ZXIucG9zLnN1Yih0aGlzLnBvcykuc2V0TGVuKDAuMik7XG4gICAgICAgICAgICAgICAgdGhpcy5zcGVlZCA9IFYyLnJhbmRvbURpc2MoKS5hZGQocGxheWVyYmlhcykuc2V0TGVuKHRoaXMubWF4U3BlZWQpO1xuICAgICAgICAgICAgICAgIHRoaXMudGltZW91dCA9IHRoaXMubWFpbi50aW1lICsgMC44ICsgTWF0aC5yYW5kb20oKSozO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoIXRoaXMuY2hhc2luZyAmJiB0aGlzLndhcm11cCA8IHRoaXMubWFpbi50aW1lICYmIHRoaXMucG9zLmRpc3RTcSh0aGlzLmdhbWUucGxheWVyLnBvcykgPCAxNTAwMDApe1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhc2luZyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih0aGlzLmNoYXNpbmcpe1xuICAgICAgICAgICAgICAgIHRoaXMuc3BlZWQgPSB0aGlzLmdhbWUucGxheWVyLnBvcy5zdWIodGhpcy5wb3MpLnNldExlbih0aGlzLmNoYXNlU3BlZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYodGhpcy5nYW1lLnBsYXllci5wb3MuZGlzdFNxKHRoaXMucG9zKSA8IDEwMCl7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lLnBsYXllci50YWtlRGFtYWdlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlbmRlcjogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByID0gdGhpcy5tYWluLnJlbmRlcmVyO1xuICAgICAgICAgICAgaWYodGhpcy5kYW1hZ2VkKXtcbiAgICAgICAgICAgICAgICB0aGlzLmRhbWFnZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICByLmNvbG9yKCd3aGl0ZScpO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgci5jb2xvcigncHVycGxlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcmFkaXVzID0gdGhpcy5yYWRpdXMgKiAwLjg7XG4gICAgICAgICAgICByLmRpc2MoMCwwLDUpO1xuICAgICAgICAgICAgci5jaXJjbGUoMCwwLHJhZGl1cyk7XG4gICAgICAgICAgICByLmNpcmNsZSgwLDAscmFkaXVzKzIpO1xuICAgICAgICB9LFxuICAgIH0pO1xuXG5cbiAgICBmdW5jdGlvbiBXb3JsZChvcHRpb25zKXtcbiAgICAgICAgdGhpcy5jZWxsU2l6ZSAgPSAyNTtcbiAgICAgICAgdGhpcy5zaXplICAgICA9IDEwMDA7XG4gICAgICAgIHRoaXMucm9vbVNpemUgPSAyNTtcbiAgICAgICAgdGhpcy5ncmlkICAgICA9IG5ldyBHcmlkMih0aGlzLnNpemUsdGhpcy5zaXplLCB7Y2VsbFNpemVYOiB0aGlzLmNlbGxTaXplLCBjZWxsU2l6ZVk6IHRoaXMuY2VsbFNpemV9KTtcbiAgICAgICAgdGhpcy5yb29tcyAgICA9IG5ldyBHcmlkMih0aGlzLnNpemUvdGhpcy5yb29tU2l6ZSwgdGhpcy5zaXplL3RoaXMucm9vbVNpemUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2NlbGxTaXplWDp0aGlzLnJvb21TaXplKnRoaXMuY2VsbFNpemUsIGNlbGxTaXplWTogdGhpcy5yb29tU2l6ZSp0aGlzLmNlbGxTaXplfSk7XG4gICAgfVxuXG4gICAgV29ybGQucHJvdG90eXBlID0ge1xuICAgICAgICByb29tdHlwZXM6IFsnZW1wdHknLCdnYXJiYWdlJywnZGVuc2UnXSxcbiAgICAgICAgZ2VuZXJhdGU6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICBmdW5jdGlvbiByYW5kcm9vbSgpe1xuICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLnJvb210eXBlc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqc2VsZi5yb29tdHlwZXMubGVuZ3RoKV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmdyaWQuZmlsbCgwKTtcbiAgICAgICAgICAgIHRoaXMucm9vbXMuZWFjaChmdW5jdGlvbih4LHksY2VsbCl7XG4gICAgICAgICAgICAgICAgdmFyIHJvb210eXBlID0gcmFuZHJvb20oKTtcbiAgICAgICAgICAgICAgICB2YXIgcnMgPSBzZWxmLnJvb21TaXplO1xuICAgICAgICAgICAgICAgIHNlbGYucm9vbXMuc2V0Q2VsbCh4LHkse3R5cGU6cm9vbXR5cGV9KTtcbiAgICAgICAgICAgICAgICBzZWxmLmdlbnJvb20ocm9vbXR5cGUsc2VsZi5ncmlkLnJlY3QoeCpycyx5KnJzLHgqcnMrcnMtMSx5KnJzK3JzLTEpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG4gICAgICAgIGdlbnJvb206IGZ1bmN0aW9uKHR5cGUsY2VsbHMpe1xuICAgICAgICAgICAgc3dpdGNoKHR5cGUpe1xuICAgICAgICAgICAgICAgIGNhc2UgJ2VtcHR5JzpcbiAgICAgICAgICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGNlbGxzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JpZC5zZXRDZWxsKGNlbGxzW2ldLngsY2VsbHNbaV0ueSwgTWF0aC5yYW5kb20oKSA8IDAuMDUgPyAxIDogMCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnZ2FyYmFnZSc6XG4gICAgICAgICAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBjZWxscy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdyaWQuc2V0Q2VsbChjZWxsc1tpXS54LGNlbGxzW2ldLnksIE1hdGgucmFuZG9tKCkgPCAwLjE1ID8gMSA6IDApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2RlbnNlJzpcbiAgICAgICAgICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGNlbGxzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JpZC5zZXRDZWxsKGNlbGxzW2ldLngsY2VsbHNbaV0ueSwgTWF0aC5yYW5kb20oKSA8IDAuNSA/IDEgOiAwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgY2VsbHMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoTWF0aC5yYW5kb20oKSA8IDAuMDEpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ2VubGluZShjZWxsc1tpXS54LGNlbGxzW2ldLnksNSwyNSxNYXRoLnJhbmRvbSgpPDAuNT8neCc6J3knKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZ2VubGluZTogZnVuY3Rpb24oeCx5LG1pbmxlbixtYXhsZW4sZGlyKXtcbiAgICAgICAgICAgIHZhciBsZW4gPSBtaW5sZW4gKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqKG1heGxlbi1taW5sZW4rMSkpO1xuICAgICAgICAgICAgdmFyIGluY3ggPSBkaXIgPT09ICd4JyA/IDEgOiAwO1xuICAgICAgICAgICAgdmFyIGluY3kgPSAxLWluY3g7XG4gICAgICAgICAgICB2YXIgcHggICA9IHggLU1hdGguZmxvb3IobGVuKmluY3gvMi4wKVxuICAgICAgICAgICAgdmFyIHB5ICAgPSB5IC1NYXRoLmZsb29yKGxlbippbmN5LzIuMClcbiAgICAgICAgICAgIHdoaWxlKGxlbi0tKXtcbiAgICAgICAgICAgICAgICB0aGlzLmdyaWQuc2V0Q2VsbChweCxweSwwKTtcbiAgICAgICAgICAgICAgICBweCs9IGluY3g7XG4gICAgICAgICAgICAgICAgcHkrPSBpbmN5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBHYW1lKG9wdGlvbnMpe31cbiAgICBHYW1lLnByb3RvdHlwZSA9IHtcbiAgICAgICAgc3RhcnQ6ICBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyICBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHRoaXMubXVzdHJlc3RhcnQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucGxheWVyID0gbmV3IFBsYXllcih7Z2FtZTogdGhpcywgbWFpbjp0aGlzLm1haW59KTtcbiAgICAgICAgICAgIHRoaXMucGxheWVyUHJvaiA9IFtdO1xuICAgICAgICAgICAgdGhpcy5lbmVtaWVzID0gW107XG4gICAgICAgICAgICB0aGlzLmVuZW15UHJvaiA9IFtdO1xuXG4gICAgICAgICAgICB0aGlzLndvcmxkICA9IG5ldyBXb3JsZCgpLmdlbmVyYXRlKCk7XG4gICAgICAgICAgICB0aGlzLmdyaWQgICA9IHRoaXMud29ybGQuZ3JpZDtcbiAgICAgICAgICAgIC8vdGhpcy5ncmlkLmVhY2goZnVuY3Rpb24oeCx5LGNlbGwpeyBzZWxmLmdyaWQuc2V0Q2VsbCh4LHksTWF0aC5yYW5kb20oKTwwLjEgPyAxIDogMCl9KTtcbiAgICAgICAgICAgIHRoaXMucGxheWVyLnNldFBvcyhWMih0aGlzLmdyaWQudG90YWxTaXplWC8yLHRoaXMuZ3JpZC50b3RhbFNpemVZLzIpKTtcblxuICAgICAgICAgICAgdGhpcy5lbmVteWZyZXEgID0gMS80MDtcbiAgICAgICAgICAgIHRoaXMuZW5lbXljb3VudCA9IDA7XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3RhcnQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB0aGlzLm11c3RyZXN0YXJ0ID0gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgYWRkUGxheWVyUHJvajogZnVuY3Rpb24ocHJvail7XG4gICAgICAgICAgICBwcm9qLm1haW4gPSB0aGlzLm1haW47XG4gICAgICAgICAgICBwcm9qLmdhbWUgPSB0aGlzO1xuICAgICAgICAgICAgcHJvai5saWZldGltZSArPSB0aGlzLm1haW4udGltZTtcbiAgICAgICAgICAgIHRoaXMucGxheWVyUHJvai5wdXNoKHByb2opO1xuICAgICAgICB9LFxuICAgICAgICBhZGRFbmVteVByb2o6IGZ1bmN0aW9uKHByb2ope1xuICAgICAgICAgICAgcHJvai5tYWluID0gdGhpcy5tYWluO1xuICAgICAgICAgICAgcHJvai5nYW1lID0gdGhpcztcbiAgICAgICAgICAgIHByb2oubGlmZXRpbWUgKz0gdGhpcy5tYWluLnRpbWU7XG4gICAgICAgICAgICB0aGlzLmVuZW15UHJvai5wdXNoKHByb2opO1xuICAgICAgICB9LFxuICAgICAgICBhZGRFbmVteTogZnVuY3Rpb24oZW5lbXkpe1xuICAgICAgICAgICAgdGhpcy5lbmVtaWVzLnB1c2goZW5lbXkpO1xuICAgICAgICB9LFxuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGNsZWFyRGVzdHJveWVkKGxpc3Qpe1xuICAgICAgICAgICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgICAgICAgICB3aGlsZShpIDwgbGlzdC5sZW5ndGgpe1xuICAgICAgICAgICAgICAgICAgICBpZihsaXN0W2ldLmRlc3Ryb3llZCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaXN0LnNwbGljZShpLDEpO1xuICAgICAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYoTWF0aC5yYW5kb20oKSA8IHRoaXMuZW5lbXlmcmVxKXtcbiAgICAgICAgICAgICAgICBpZihNYXRoLnJhbmRvbSgpIDwgMC4xKXtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFbmVteShuZXcgU29sZGllcih7bWFpbjogdGhpcy5tYWluLCBwb3M6dGhpcy5wbGF5ZXIucG9zLmFkZChWMi5yYW5kb21EaXNjKCkuc2NhbGUoMTAwMCkpfSkpO1xuICAgICAgICAgICAgICAgIH1lbHNlIGlmKE1hdGgucmFuZG9tKCkgPCAwLjIpe1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEVuZW15KG5ldyBHcnVudCh7bWFpbjogdGhpcy5tYWluLCBwb3M6dGhpcy5wbGF5ZXIucG9zLmFkZChWMi5yYW5kb21EaXNjKCkuc2NhbGUoMTAwMCkpfSkpO1xuICAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEVuZW15KG5ldyBLYW1pa2F6ZSh7bWFpbjogdGhpcy5tYWluLCBwb3M6dGhpcy5wbGF5ZXIucG9zLmFkZChWMi5yYW5kb21EaXNjKCkuc2NhbGUoMTAwMCkpfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0aGlzLmVuZW15Y291bnQrKztcbiAgICAgICAgICAgICAgICBpZighKHRoaXMuZW5lbXljb3VudCAlIDEwKSl7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW5lbXlmcmVxICs9IDAuMSAvIHRoaXMuZW5lbXljb3VudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnBsYXllci51cGRhdGUoKTtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDAsIGxlbiA9IHRoaXMuZW5lbWllcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgICAgICAgICAgdGhpcy5lbmVtaWVzW2ldLnVwZGF0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yKHZhciBpID0gMCwgbGVuID0gdGhpcy5wbGF5ZXJQcm9qLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgcHJvaiA9IHRoaXMucGxheWVyUHJvaltpXTtcbiAgICAgICAgICAgICAgICAgICAgcHJvai51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICBmb3IodmFyIGogPSAwLCBqbGVuID0gdGhpcy5lbmVtaWVzLmxlbmd0aDsgaiA8IGpsZW47IGorKyl7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlbmVteSA9IHRoaXMuZW5lbWllc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgaWYocHJvai5wb3MuZGlzdFNxKGVuZW15LnBvcykgPD0gZW5lbXkuc3FSYWRpdXMpe1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvai5hdHRhY2soZW5lbXkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHByID0gdGhpcy5wbGF5ZXIucmFkaXVzICogdGhpcy5wbGF5ZXIucmFkaXVzO1xuICAgICAgICAgICAgZm9yKHZhciBpID0gMCwgbGVuID0gdGhpcy5lbmVteVByb2oubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBwcm9qID0gdGhpcy5lbmVteVByb2pbaV07XG4gICAgICAgICAgICAgICAgICAgIHByb2oudXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgaWYocHJvai5wb3MuZGlzdFNxKHRoaXMucGxheWVyLnBvcykgPD0gcHIpe1xuICAgICAgICAgICAgICAgICAgICBwcm9qLmF0dGFjayh0aGlzLnBsYXllcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2xlYXJEZXN0cm95ZWQodGhpcy5lbmVtaWVzKTtcblxuICAgICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgICAgIGNsZWFyRGVzdHJveWVkKHRoaXMucGxheWVyUHJvaik7XG4gICAgICAgICAgICBjbGVhckRlc3Ryb3llZCh0aGlzLmVuZW15UHJvaik7XG4gICAgICAgICAgICBpZih0aGlzLm11c3RyZXN0YXJ0KXtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlbmRlcjogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHZhciBjdHggID0gdGhpcy5tYWluLmNvbnRleHQ7XG4gICAgICAgICAgICB2YXIgciAgICA9IHRoaXMubWFpbi5yZW5kZXJlcjtcbiAgICAgICAgICAgIHIuY29sb3IoJ3JlZCcpO1xuICAgICAgICAgICAgci5saW5lKDAsMCwyMCwwKTtcbiAgICAgICAgICAgIHIubGluZSgwLDAsMCwyMCk7XG5cbiAgICAgICAgICAgIHIuY29sb3IoJ2JsdWUnKTtcbiAgICAgICAgICAgIHZhciBtb3VzZSA9IHRoaXMubWFpbi5tb3VzZSgpO1xuICAgICAgICAgICAgci5saW5lKG1vdXNlLngtMTAsbW91c2UueS0xMCxtb3VzZS54KzEwLG1vdXNlLnkrMTApO1xuICAgICAgICAgICAgci5saW5lKG1vdXNlLngrMTAsbW91c2UueS0xMCxtb3VzZS54LTEwLG1vdXNlLnkrMTApO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiByZW5kZXJFbnRpdHkoZW50aXR5KXtcbiAgICAgICAgICAgICAgICBjdHguc2F2ZSgpO1xuICAgICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoZW50aXR5LnBvcy54LGVudGl0eS5wb3MueSk7XG4gICAgICAgICAgICAgICAgZW50aXR5LnJlbmRlcigpO1xuICAgICAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZW5kZXJFbnRpdHkodGhpcy5wbGF5ZXIpO1xuICAgICAgICAgICAgZm9yKHZhciBpID0gMCwgbGVuID0gdGhpcy5lbmVteVByb2oubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICAgICAgICAgIHJlbmRlckVudGl0eSh0aGlzLmVuZW15UHJvaltpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSB0aGlzLnBsYXllclByb2oubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICAgICAgICAgIHJlbmRlckVudGl0eSh0aGlzLnBsYXllclByb2pbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yKHZhciBpID0gMCwgbGVuID0gdGhpcy5lbmVtaWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgICAgICAgICByZW5kZXJFbnRpdHkodGhpcy5lbmVtaWVzW2ldKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGNzID0gdGhpcy53b3JsZC5jZWxsU2l6ZTtcbiAgICAgICAgICAgIHRoaXMud29ybGQuZ3JpZC5waXhlbFJlY3QodGhpcy5tYWluLnBvcy54IC0gdGhpcy5tYWluLndpZHRoLzIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbi5wb3MueSAtIHRoaXMubWFpbi5oZWlnaHQvMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tYWluLnBvcy54ICsgdGhpcy5tYWluLndpZHRoLzIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbi5wb3MueSArIHRoaXMubWFpbi5oZWlnaHQvMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oeCx5LGNlbGwpe1xuICAgICAgICAgICAgICAgIGlmKGNlbGwpe1xuICAgICAgICAgICAgICAgICAgICBpZihjZWxsIDwgMCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihjZWxsIDwgLTAuNzUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHIuY29sb3IoJyM1NTUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1lbHNlIGlmKGNlbGwgPCAtMC41KXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByLmNvbG9yKCcjNjY2Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9ZWxzZSBpZihjZWxsIDwgLTAuMjUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHIuY29sb3IoJyM3NzcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHIuY29sb3IoJyNhYWEnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYud29ybGQuZ3JpZC5zZXRDZWxsKHgseSwtY2VsbCk7XG4gICAgICAgICAgICAgICAgICAgIH1lbHNlIGlmKGNlbGwgPCAwLjUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgci5jb2xvcignIzJiMmIyYicpO1xuICAgICAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHIuY29sb3IoJyMzMzMnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QoeCpjcywgeSpjcyxjcyxjcylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9LFxuICAgIH07XG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJyxmdW5jdGlvbigpe1xuICAgICAgICB3aW5kb3cubWFpbiA9IG5ldyBNYWluKHtcbiAgICAgICAgICAgIGNhbnZhczogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2dhbWVfY2FudmFzJyksXG4gICAgICAgICAgICBpbnB1dDogIG5ldyBJbnB1dCgpLCBcbiAgICAgICAgICAgIHNjZW5lOiAgbmV3IEdhbWUoKX0pO1xuICAgICAgICB3aW5kb3cubWFpbi5zdGFydCgpO1xuICAgIH0pO1xuXG59KShleHBvcnRzKTtcbiIsIlxuXG4vKiAtLS0tLS0gMkQgR3JpZHMgLS0tLS0gKi9cblxuKGZ1bmN0aW9uKG1vZHVsYSl7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAvKlxuICAgICAqIEdyaWQyIHJlcHJlc2VudHMgYSAyRCBHcmlkIHRoYXQgY2FuIGJlIHVzZWQgZm9yIHBoeXNpY3MsXG4gICAgICogcGF0aHRyYWNpbmcsIHJheXRyYWNpbmcsIGV0Yy4gR3JpZDIgbGV0cyB5b3UgcHV0IHdoYXRldmVyIHlvdVxuICAgICAqIHdhbnQgaW4gdGhlIGNlbGxzIGFuZCBkb2Vzbid0IG1vZGlmeSB0aGVtIGJlaGluZCB5b3VyIGJhY2suXG4gICAgICpcbiAgICAgKiBzaXplWDogaW50ID4gMCwgdGhlIG51bWJlciBvZiBjZWxscyBpbiB0aGUgWCBheGlzXG4gICAgICogc2l6ZVk6IGludCA+IDAsIHRoZSBudW1iZXIgb2YgY2VsbHMgaW4gdGhlIFkgYXhpc1xuICAgICAqIGFyZ3MgOiBbb3B0aW9uYWxdIHtcbiAgICAgKiAgIGNlbGxTaXplWCA6IGZsb2F0ID4gMCA6IGRlZmF1bHQgMS4wOiB0aGUgc2l6ZSBvZiBhIGNlbGwgb24gdGhlIFggYXhpc1xuICAgICAqICAgY2VsbFNpemVZIDogZmxvYXQgPiAwIDogZGVmYXVsdCAxLjA6IHRoZSBzaXplIG9mIGEgY2VsbCBvbiB0aGUgWSBheGlzXG4gICAgICogICBpc1NvbGlkOiBmdW5jdGlvbih4LHkpIC0+IGJvb2wgOiBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0cnVlIGlmIFxuICAgICAqICAgICAgICAgICAgYSBjZWxsIGlzIHNvbGlkLiAodXNlZCBmb3IgcGF0aGZpbmRpbmcgJiBjb2xsaXNpb25zKVxuICAgICAqICAgICAgICAgICAgYnkgZGVmYXVsdCwgJ3RydXRoeScgY2VsbHMgYXJlIGNvbnNpZGVyZWQgc29saWRcbiAgICAgKiAgIGRpc3Q6ICBmdW5jdGlvbih4MSx5MSwgeDIseTIpIC0+IEZsb2F0IDogYSBmdW5jdGlvbiB0aGF0IGNvbXB1dGVzXG4gICAgICogICAgICAgICAgdGhlIGRpc3RhbmNlIGJldHdlZW4gdHdvIGNlbGxzLiBHcmlkMi5kaXN0Q29tcG9zaXRlKC4uKSBpcyBcbiAgICAgKiAgICAgICAgICB0aGUgZGVmYXVsdC5cbiAgICAgKiAgIG5laWdoYm9yczogZnVuY3Rpb24oeCx5KSAtPiBbe3gseSxjZWxsfSwuLi5dIDogYSBmdW5jdGlvbiB0aGF0XG4gICAgICogICAgICAgICAgcmV0dXJucyBhIGxpc3Qgb2YgdGhlIG5laWdoYm9ycyBvZiBjZWxsIHgseVxuICAgICAqICAgZmlsbDogIGFueXRoaW5nIDogYWxsIGNlbGxzIHdpbGwgY29udGFpbiB0aGlzLlxuICAgICAqICAgY2VsbHM6IEFycmF5W3NpemVYKnNpemVZXSwgdGhlIGNlbGxzIG9mIHRoZSBncmlkLCBsaW5lYXJpemVkOiBcbiAgICAgKiAgICAgICAgICBYIHJvd3MgYXJlIHB1dCBvbmUgYWZ0ZXIgYW5vdGhlciBieSBpbmNyZWFzaW5nIFlcbiAgICAgKiAgICAgICAgICB0aGlzIHNldHRpbmdzIG92ZXJyaWRlcyAnZmlsbCdcbiAgICAgKi9cblxuICAgIGZ1bmN0aW9uIEdyaWQyKHNpemVYLHNpemVZLGFyZ3Mpe1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcbiAgICAgICAgdGhpcy5zaXplWCA9IHNpemVYIHx8IDE7XG4gICAgICAgIHRoaXMuc2l6ZVkgPSBzaXplWSB8fCAxO1xuICAgICAgICB0aGlzLmNlbGxTaXplWCA9IGFyZ3MuY2VsbFNpemVYIHx8IDEuMDtcbiAgICAgICAgdGhpcy5jZWxsU2l6ZVkgPSBhcmdzLmNlbGxTaXplWSB8fCAxLjA7XG4gICAgICAgIHRoaXMuY2VsbHMgPSBhcmdzLmNlbGxzIHx8IFtdO1xuICAgICAgICB0aGlzLnRvdGFsU2l6ZVggPSB0aGlzLnNpemVYICogdGhpcy5jZWxsU2l6ZVg7XG4gICAgICAgIHRoaXMudG90YWxTaXplWSA9IHRoaXMuc2l6ZVkgKiB0aGlzLmNlbGxTaXplWTtcblxuICAgICAgICBpZih0eXBlb2YgYXJncy5pc1NvbGlkID09PSAnZnVuY3Rpb24nICYmIGFyZ3MuaXNTb2xpZCAhPT0gR3JpZDIucHJvdG90eXBlLmlzU29saWQpe1xuICAgICAgICAgICAgdGhpcy5pc1NvbGlkID0gYXJncy5pc1NvbGlkO1xuICAgICAgICB9XG4gICAgICAgIGlmKHR5cGVvZiBhcmdzLmRpc3QgPT09ICdmdW5jdGlvbicgJiYgYXJncy5kaXN0ICE9PSBHcmlkMi5wcm90b3R5cGUuZGlzdENvbXBvc2l0ZSl7XG4gICAgICAgICAgICB0aGlzLmRpc3QgPSBhcmdzLmRpc3Q7XG4gICAgICAgIH1cbiAgICAgICAgaWYodHlwZW9mIGFyZ3MubmVpZ2hib3JzID09PSAnZnVuY3Rpb24nICYmIGFyZ3MubmVpZ2hib3JzICE9PSBHcmlkMi5wcm90b3R5cGUubmVpZ2hib3JzKXtcbiAgICAgICAgICAgIHRoaXMubmVpZ2hib3JzID0gYXJncy5uZWlnaGJvcnM7XG4gICAgICAgIH1cbiAgICAgICAgaWYodHlwZW9mIGFyZ3MuZmlsbCAhPT0gJ3VuZGVmaW5lZCcgJiYgIWFyZ3MuY2VsbHMpe1xuICAgICAgICAgICAgdGhpcy5maWxsKGFyZ3MuZmlsbCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBtb2R1bGEuR3JpZDIgPSBHcmlkMjtcblxuICAgIHZhciBwcm90byA9IEdyaWQyLnByb3RvdHlwZTtcblxuICAgIC8vIHJldHVybnMgdGhlIGNlbGwgYXQgZ3JpZCBjb29yZGluYXRlcyB4LHkuXG4gICAgLy8gaXQgd2lsbCBoYXBwaWxseSByZXR1cm4gd3JvbmcgcmVzdWx0cyBpZiB4LHkgYXJlIG91dHNpZGUgdGhlIGdyaWRcbiAgICBwcm90by5nZXRDZWxsVW5zYWZlID0gZnVuY3Rpb24oeCx5KXtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2VsbHNbeSp0aGlzLnNpemVYK3hdO1xuICAgIH07XG5cbiAgICAvLyByZXR1cm5zIHRoZSBjZWxsIGF0IGdyaWQgY29vcmRpbmF0ZXMgeCx5IG9yIHVuZGVmaW5lZCBpZiBvdXRzaWRlIHRoZSBncmlkXG4gICAgcHJvdG8uZ2V0Q2VsbCA9IGZ1bmN0aW9uKHgseSl7XG4gICAgICAgIGlmKCB4ID49IDAgJiYgeSA+PSAwICYmIHggPCB0aGlzLnNpemVYICYmIHkgPCB0aGlzLnNpemVZKXtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNlbGxzW3kqdGhpcy5zaXplWCt4XTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICAvLyBzZXRzIHRoZSBjZWxsIGF0IGdyaWQgY29vcmRpbmF0ZXMgeCx5XG4gICAgcHJvdG8uc2V0Q2VsbCA9IGZ1bmN0aW9uKHgseSxjZWxsKXtcbiAgICAgICAgaWYoeCA+PSAwICYmIHkgPj0gMCAmJiB4IDwgdGhpcy5zaXplWCAmJiB5IDwgdGhpcy5zaXplWSl7XG4gICAgICAgICAgICB0aGlzLmNlbGxzW3kqdGhpcy5zaXplWCt4XSA9IGNlbGw7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAvLyByZXR1cm5zIHRydWUgaWYgdGhlIGNlbGwgYXQgeCx5IGlzIHNvbGlkIChhbiBvYnN0YWNsZSBmb3IgcGF0aGZpbmRpbmcgYW5kIGdyaWQgY29sbGlzaW9ucylcbiAgICAvLyBieSBkZWZhdWx0IHRydXRoeSBjZWxscyBhcmUgY29uc2lkZXJlZCBzb2xpZC4gVGhpcyBtZXRob2QgY2FuIGJlIG92ZXJyaWRlbiBieSB0aGUgR3JpZDJcbiAgICAvLyBjb25zdHJ1Y3RvclxuICAgIHByb3RvLmlzU29saWQgPSBmdW5jdGlvbih4LHkpe1xuICAgICAgICByZXR1cm4gISF0aGlzLmdldENlbGwoeCx5KTtcbiAgICB9O1xuICAgIFxuICAgIC8vIHJldHVybnMgdGhlIG1hbmF0aGFuIGRpc3RhbmNlIGJldHdlZW4gdHdvIGNlbGxzICh4MSx5MSksICh4Mix5MilcbiAgICBwcm90by5kaXN0TWFuaGF0dGFuID0gZnVuY3Rpb24oeDEseTEseDIseTIpe1xuICAgICAgICByZXR1cm4gTWF0aC5hYnMoeDIteDEpKnRoaXMuY2VsbFNpemVYICsgTWF0aC5hYnMoeTIgLSB5MSkqdGhpcy5jZWxsU2l6ZVk7XG4gICAgfTtcbiAgICBcbiAgICAvLyByZXR1cm5zIHRoZSBlY2xpZGlhbiBkaXN0YW5jZSBiZXR3ZWVuIHR3byBjZWxscyAoeDEseTEpLCAoeDIseTIpXG4gICAgcHJvdG8uZGlzdEV1Y2xpZGlhbiA9IGZ1bmN0aW9uKHgxLHkxLHgyLHkyKXtcbiAgICAgICAgdmFyIGR4ID0gKHgyIC0geDEpICogdGhpcy5jZWxsU2l6ZVg7ICBcbiAgICAgICAgdmFyIGR5ID0gKHkyIC0geTEpICogdGhpcy5jZWxsU2l6ZVk7IFxuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KGR4KmR4ICsgZHkqZHkpO1xuICAgIH07XG4gICAgXG4gICAgLy8gcmV0dXJucyBhIGNvbXBvc2l0ZSBkaXN0YW5jZSBiZXR3ZWVuIHR3byBjZWxscyAoeDEseTEpLCAoeDIseTIpXG4gICAgLy8gdGhlIGNvbXBvc2l0ZSBjb21wdXRlcyBhIHBhdGggYmV0d2VlbiB0aGUgdHdvIGNlbGxzIG1hZGUgb2YgaG9yaXpvbnRhbFxuICAgIC8vIGFuZCBkaWFnb25hbCBtb3Zlcywgd2l0aCB0aGUgZGlzdGFuY2UgYmV0d2VlbiB0d28gZGlhZ29uYWwgY2VsbHNcbiAgICAvLyBiZWluZyAxNTAlIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIHR3byBob3Jpem9udGFsIGNlbGxzLlxuICAgIC8vIFRoaXMgaXMgdGhlIGRlZmF1bHQgZGlzdGFuY2UgYXMgaXQgZ2VuZXJhdGVzIHRoZSBiZXN0IHBhdGhmaW5kaW5nIHJlc3VsdHNcbiAgICBwcm90by5kaXN0Q29tcG9zaXRlID0gZnVuY3Rpb24oeDEseTEseDIseTIpe1xuICAgICAgICB2YXIgZHggPSBNYXRoLmFicyh4MiAtIHgxKSAqIHRoaXMuY2VsbFNpemVYO1xuICAgICAgICB2YXIgZHkgPSBNYXRoLmFicyh5MiAtIHkxKSAqIHRoaXMuY2VsbFNpemVZOyBcbiAgICAgICAgdmFyIHJlY3QgPSBNYXRoLmFicyhkeC1keSk7XG4gICAgICAgIHZhciBkaWFnID0gTWF0aC5taW4oZHgsZHkpO1xuICAgICAgICByZXR1cm4gcmVjdCArIDEuNSAqIGRpYWc7XG4gICAgfTtcblxuXG4gICAgLy8gcmV0dXJucyB0aGUgZGlzdGFuY2UgYmV0d2VlbiB0d28gY2VsbHMgKHgxLHkxKSwgKHgyLHkyKSB1c2luZyB0aGUgZ3JpZCdzXG4gICAgLy8gc3BlY2lmaWMgZGlzdGFuY2UgbWV0cmljLiBkZWZhdWx0IGlzIGRpc3RDb21wb3NpdGVcbiAgICBwcm90by5kaXN0ID0gZnVuY3Rpb24oeDEseTEseDIseTIpe1xuICAgICAgICByZXR1cm4gdGhpcy5kaXN0Q29tcG9zaXRlKHgxLHkxLHgyLHkyKTtcbiAgICB9O1xuXG4gICAgLy8gcmV0dXJucyBhIG5ldyBHcmlkMiBpbnN0YW5jZSB3aXRoIHRoZSBzYW1lIGNlbGxzIGFuZCBwcm9wZXJ0aWVzIGFzIHRoaXMuXG4gICAgcHJvdG8uY2xvbmUgPSBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4gbmV3IG1vZHVsYS5HcmlkMih0aGlzLnNpemVYLHRoaXMuc2l6ZVksIHtcbiAgICAgICAgICAgIGNlbGxTaXplWDogdGhpcy5jZWxsU2l6ZVgsXG4gICAgICAgICAgICBjZWxsU2l6ZVk6IHRoaXMuY2VsbFNpemVZLFxuICAgICAgICAgICAgY2VsbHM6IHRoaXMuY2VsbHMuc2xpY2UoMCksXG4gICAgICAgICAgICBpc1NvbGlkOiB0aGlzLmlzU29saWQsXG4gICAgICAgICAgICBkaXN0OiB0aGlzLmRpc3QsXG4gICAgICAgICAgICBuZWlnaGJvcnM6IHRoaXMubmVpZ2hib3JzLFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gc2V0cyBldmVyeSBjZWxsIGluIHRoZSBncmlkIHRvICdjZWxsJ1xuICAgIHByb3RvLmZpbGwgPSBmdW5jdGlvbihjZWxsKXtcbiAgICAgICAgdmFyIGxlbiA9IHRoaXMuc2l6ZVggKiB0aGlzLnNpemVZO1xuICAgICAgICBpZih0aGlzLmNlbGxzLmxlbmd0aCA9PT0gbGVuKXtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgICAgICAgICAgdGhpcy5jZWxsc1tpXSA9IGNlbGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgdGhpcy5jZWxscyA9IFtdO1xuICAgICAgICAgICAgd2hpbGUobGVuLS0pe1xuICAgICAgICAgICAgICAgIHRoaXMuY2VsbHMucHVzaChjZWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyByZXR1cm5zIHRoZSBjZWxsIHt4LHksY2VsbH0gdGhhdCBjb250YWlucyB0aGUgcGl4ZWwgY29vcmRpbmF0ZSAocHgscHkpXG4gICAgcHJvdG8uZ2V0Q2VsbEF0UGl4ZWwgPSBmdW5jdGlvbihweCxweSl7XG4gICAgICAgIGlmKHB4IDwgMCB8fCBweCA+PSB0aGlzLnRvdGFsU2l6ZVggfHwgcHkgPCAwIHx8IHB5ID49IHRoaXMudG90YWxTaXplWSl7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHZhciB4ID0gTWF0aC5tYXgoMCxNYXRoLm1pbih0aGlzLnNpemVYLTEsIE1hdGguZmxvb3IocHgvdGhpcy5jZWxsU2l6ZVgpKSk7XG4gICAgICAgICAgICB2YXIgeSA9IE1hdGgubWF4KDAsTWF0aC5taW4odGhpcy5zaXplWS0xLCBNYXRoLmZsb29yKHB5L3RoaXMuY2VsbFNpemVZKSkpO1xuICAgICAgICAgICAgcmV0dXJuIHsgeDp4LCB5OnksIGNlbGw6dGhpcy5nZXRDZWxsVW5zYWZlKHgseSkgfTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyByZXR1cm5zIHRydWUgaWYgdGhlIGNlbGwgeCx5IGlzIGluc2lkZSB0aGlzIGdyaWRcbiAgICBwcm90by5jZWxsSW5zaWRlID0gZnVuY3Rpb24oeCx5KXtcbiAgICAgICAgcmV0dXJuIHggPj0gMCAmJiB4IDwgdGhpcy5zaXplWCAmJiB5ID49IDAgJiYgeSA8IHRoaXMuc2l6ZVk7XG4gICAgfTtcblxuICAgIC8vIHJldHVybnMgdHJ1ZSBpZiB0aGVyZSBpcyBhIGNlbGwgaW4gdGhlIGdyaWQgY29udGFpbmluZyB0aGUgcGl4ZWxcbiAgICBwcm90by5waXhlbEluc2lkZSA9IGZ1bmN0aW9uKHgseSl7XG4gICAgICAgIHJldHVybiB4ID49IDAgJiYgeCA8IHRoaXMuc2l6ZVggKiB0aGlzLmNlbGxTaXplWCAmJiB5ID49IDAgJiYgeSA8IHRoaXMuc2l6ZVkgKiB0aGlzLmNlbGxTaXplWTtcbiAgICB9O1xuXG4gICAgLy8gaXRlcmF0ZXMgb3ZlciBlYWNoIGNlbGwgb2YgdGhlIGdyaWQgYnkgY2FsbGluZyB0aGUgaXRlcmF0b3IgZnVuY3Rpb25cbiAgICAvLyBpdGVyYXRvcih4LHksY2VsbCkgZm9yIGVhY2ggY2VsbFxuICAgIHByb3RvLmVhY2ggPSBmdW5jdGlvbihpdGVyYXRvcil7XG4gICAgICAgIHZhciB4ID0gMCwgeSA9IDAsIGkgPSAwLCBsZW4gPSB0aGlzLnNpemVYICogdGhpcy5zaXplWTtcbiAgICAgICAgd2hpbGUoaSA8IGxlbil7XG4gICAgICAgICAgICBpdGVyYXRvcih4LHksdGhpcy5jZWxsc1tpXSk7XG4gICAgICAgICAgICBpZigrK3ggPj0gdGhpcy5zaXplWCl7XG4gICAgICAgICAgICAgICAgeCA9IDA7XG4gICAgICAgICAgICAgICAgeSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICAvLyBpdGVyYXRlcyBvdmVyIGVhY2ggY2VsbCBvZiB0aGUgZ3JpZCB1bnRpbCB0aGUgaXRlcmF0b3IgZnVuY3Rpb25cbiAgICAvLyBpdGVyYXRvcih4LHksY2VsbCkgLT4gYm9vbCByZXR1cm5zIHRydWUsIHRoZW4gcmV0dXJucyB0aGUgY29ycmVzcG9uZGluZ1xuICAgIC8vIGNlbGwgYW5kIGNvb3JkaW5hdGVzIDoge3gseSxjZWxsfVxuICAgIHByb3RvLmZpbmQgPSBmdW5jdGlvbihpdGVyYXRvcil7XG4gICAgICAgIHZhciB4ID0gMCwgeSA9IDAsIGkgPSAwLCBsZW4gPSB0aGlzLnNpemVYICogdGhpcy5zaXplWTtcbiAgICAgICAgd2hpbGUoaSA8IGxlbil7XG4gICAgICAgICAgICBpZihpdGVyYXRvcih4LHksdGhpcy5jZWxsc1tpXSkpe1xuICAgICAgICAgICAgICAgIHJldHVybiB7eDp4LCB5OnksIGNlbGw6dGhpcy5jZWxsc1tpXX07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZigrK3ggPj0gdGhpcy5zaXplWCl7XG4gICAgICAgICAgICAgICAgeCA9IDA7XG4gICAgICAgICAgICAgICAgeSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfTtcblxuICAgIC8vIGl0ZXJhdGVzIG92ZXIgZWFjaCBjZWxsIG9mIHRoZSBncmlkLCByZXBsYWNpbmcgdGhlIGV4aXN0aW5nIGNlbGwgYnlcbiAgICAvLyB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBpdGVyYXRvciBmdW5jdGlvbiBpdGVyYXRvcih4LHksY2VsbCkgLT4gY2VsbFxuICAgIHByb3RvLm1hcCA9IGZ1bmN0aW9uKGl0ZXJhdG9yKXtcbiAgICAgICAgdmFyIHggPSAwLCB5ID0gMCwgaSA9IDAsIGxlbiA9IHRoaXMuc2l6ZVggKiB0aGlzLnNpemVZO1xuICAgICAgICB3aGlsZShpIDwgbGVuKXtcbiAgICAgICAgICAgIHRoaXMuY2VsbHNbaV0gPSBpdGVyYXRvcih4LHksdGhpcy5jZWxsc1tpXSk7XG4gICAgICAgICAgICBpZigrK3ggPj0gdGhpcy5zaXplWCl7XG4gICAgICAgICAgICAgICAgeCA9IDA7XG4gICAgICAgICAgICAgICAgeSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIGl0ZXJhdGVzIG92ZXIgZWFjaCBjZWxsIGNvbnRhaW5lZCBpbiB0aGUgcmVjdGFuZ3VsYXIgcmVnaW9uIGNlbGxcbiAgICAvLyBbIG1pbngsIG1pbnkgXSBbbWF4eCwgbWF4eV0gKGluY2x1c2l2ZSksIGJ5IGNhbGxpbmcgdGhlIChvcHRpb25hbClcbiAgICAvLyBpdGVyYXRvciBmdW5jdGlvbiBpdGVyYXRvcih4LHksY2VsbCksIGFuZCB0aGVuIHJldHVybmluZyB0aGUgY2VsbHMgXG4gICAgLy8ge3gseSxjZWxsfSBhcyBhIGxpc3RcbiAgICBwcm90by5yZWN0ID0gZnVuY3Rpb24obWlueCwgbWlueSwgbWF4eCwgbWF4eSwgaXRlcmF0b3Ipe1xuICAgICAgICBpZihtYXh4IDwgMCB8fCBtYXh5IDwgMCB8fCBtaW54ID4gdGhpcy5zaXplWCB8fCBtaW55ID49IHRoaXMuc2l6ZVkpe1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHZhciBjZWxscyA9IFtdO1xuICAgICAgICAgICAgbWlueCA9IE1hdGgubWF4KDAsbWlueCk7XG4gICAgICAgICAgICBtaW55ID0gTWF0aC5tYXgoMCxtaW55KTtcbiAgICAgICAgICAgIG1heHggPSBNYXRoLm1pbih0aGlzLnNpemVYLTEsIG1heHgpO1xuICAgICAgICAgICAgbWF4eSA9IE1hdGgubWluKHRoaXMuc2l6ZVktMSwgbWF4eSk7XG4gICAgICAgICAgICBmb3IodmFyIHggPSBtaW54OyB4IDw9IG1heHg7IHgrKyl7XG4gICAgICAgICAgICAgICAgZm9yKHZhciB5ID0gbWlueTsgeSA8PSBtYXh5OyB5Kyspe1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2VsbCA9IHRoaXMuZ2V0Q2VsbFVuc2FmZSh4LHkpO1xuICAgICAgICAgICAgICAgICAgICBjZWxscy5wdXNoKHt4OngsIHk6eSwgY2VsbDogY2VsbH0pO1xuICAgICAgICAgICAgICAgICAgICBpZihpdGVyYXRvcil7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVyYXRvci5jYWxsKHRoaXMseCx5LGNlbGwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNlbGxzO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICAvLyBpdGVyYXRlcyBvdmVyIGVhY2ggY2VsbCBvdmVybGFwcGluZyB0aGUgcmVjdGFuZ3VsYXIgcmVnaW9uIGRldGVybWluZWRcbiAgICAvLyBieSB0aGUgaW5jbHVzaXZlIHBpeGVsIGNvb3JkaW5hdGUgWyBtaW54LCBtaW55IF0gW21heHgsIG1heHldIGJ5IFxuICAgIC8vIGNhbGxpbmcgdGhlIChvcHRpb25hbCkgaXRlcmF0b3IgZnVuY3Rpb24gaXRlcmF0b3IoeCx5LGNlbGwpLCBhbmQgXG4gICAgLy8gdGhlbiByZXR1cm5pbmcgdGhlIGNlbGxzIHt4LHksY2VsbH0gYXMgYSBsaXN0XG4gICAgcHJvdG8ucGl4ZWxSZWN0ID0gZnVuY3Rpb24obWlueCwgbWlueSwgbWF4eCwgbWF4eSwgaXRlcmF0b3Ipe1xuICAgICAgICB2YXIgdG90YWxTaXplWCA9IHRoaXMuc2l6ZVggKiB0aGlzLmNlbGxTaXplWDtcbiAgICAgICAgdmFyIHRvdGFsU2l6ZVkgPSB0aGlzLnNpemVZICogdGhpcy5jZWxsU2l6ZVk7XG4gICAgICAgIGlmKG1heHggPD0gMCB8fCBtYXh5IDw9IDApe1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9ZWxzZSBpZihtaW54ID49IHRvdGFsU2l6ZVggfHwgbWlueSA+PSB0b3RhbFNpemVZKXtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICB2YXIgY3NpemV4ICA9IDEuMCAvIHRoaXMuY2VsbFNpemVYO1xuICAgICAgICAgICAgdmFyIGNzaXpleSA9IDEuMCAvIHRoaXMuY2VsbFNpemVZO1xuICAgICAgICAgICAgbWlueCA9IE1hdGguZmxvb3IoTWF0aC5tYXgobWlueCwwKSAqIGNzaXpleCk7XG4gICAgICAgICAgICBtaW55ID0gTWF0aC5mbG9vcihNYXRoLm1heChtaW55LDApICogY3NpemV5KTtcbiAgICAgICAgICAgIG1heHggPSBNYXRoLmZsb29yKE1hdGgubWluKG1heHgsdG90YWxTaXplWC0xKSAqIGNzaXpleCk7XG4gICAgICAgICAgICBtYXh5ID0gTWF0aC5mbG9vcihNYXRoLm1pbihtYXh5LHRvdGFsU2l6ZVktMSkgKiBjc2l6ZXkpO1xuICAgICAgICAgICAgdmFyIGNlbGxzID0gW107XG4gICAgICAgICAgICBmb3IodmFyIHggPSBtaW54OyB4IDw9IG1heHg7IHgrKyl7XG4gICAgICAgICAgICAgICAgZm9yKHZhciB5ID0gbWlueTsgeSA8PSBtYXh5OyB5Kyspe1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2VsbCA9IHRoaXMuZ2V0Q2VsbFVuc2FmZSh4LHkpO1xuICAgICAgICAgICAgICAgICAgICBjZWxscy5wdXNoKHt4OngsIHk6eSwgY2VsbDogY2VsbH0pO1xuICAgICAgICAgICAgICAgICAgICBpZihpdGVyYXRvcil7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVyYXRvci5jYWxsKHRoaXMseCx5LGNlbGwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNlbGxzO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIGl0ZXJhdGVzIG92ZXIgZWFjaCBjZWxsIGF0IGEgZGlzdGFuY2Ugc21hbGxlciBvciBlcXVhbCB0byByIGZyb20gXG4gICAgLy8gdGhlIGNlbGwgKGN4LGN5KSAgYnkgY2FsbGluZyB0aGUgKG9wdGlvbmFsKSBpdGVyYXRvciBmdW5jdGlvbiBcbiAgICAvLyBpdGVyYXRvcih4LHksY2VsbCksIGFuZCB0aGVuIHJldHVybmluZyB0aGUgY2VsbHMgXG4gICAgLy8ge3gseSxjZWxsfSBhcyBhIGxpc3RcbiAgICBwcm90by5jaXJjbGUgPSBmdW5jdGlvbihjeCxjeSxyLG9wdHMsaXRlcmF0b3Ipe1xuICAgICAgICB2YXIgc2VsZiAgPSB0aGlzO1xuICAgICAgICB2YXIgY2VsbHMgPSBbXTtcbiAgICAgICAgaWYoIHR5cGVvZiBvcHRzID09PSAnZnVuY3Rpb24nICl7XG4gICAgICAgICAgICBpdGVyYXRvciA9IG9wdHM7XG4gICAgICAgICAgICBvcHRzID0ge307XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgb3B0cyA9IG9wdHMgfHwge307XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZGlzdCA9IG9wdHMuZGlzdCA/XG4gICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oKXsgcmV0dXJuIG9wdHMuZGlzdC5hcHBseShzZWxmLGFyZ3VtZW50cyk7IH1cbiAgICAgICAgICAgICAgICAgOiBmdW5jdGlvbigpeyByZXR1cm4gc2VsZi5kaXN0LmFwcGx5KHNlbGYsYXJndW1lbnRzKTsgfTtcblxuICAgICAgICB2YXIgcnggPSBNYXRoLmNlaWwociAvIHRoaXMuY2VsbFNpemVYKTtcbiAgICAgICAgdmFyIHJ5ID0gTWF0aC5jZWlsKHIgLyB0aGlzLmNlbGxTaXplWSk7XG4gICAgICAgIHRoaXMucmVjdChjeC1yeCxjeS1yeSxjeCtyeCxjeStyeSxmdW5jdGlvbih4LHksY2VsbCl7XG4gICAgICAgICAgICBpZihkaXN0KGN4LGN5LHgseSkgPD0gcil7XG4gICAgICAgICAgICAgICAgY2VsbHMucHVzaCh7eDp4LHk6eSxjZWxsOmNlbGx9KTtcbiAgICAgICAgICAgICAgICBpZihpdGVyYXRvcil7XG4gICAgICAgICAgICAgICAgICAgIGl0ZXJhdG9yLmNhbGwodGhpcyx4LHksY2VsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGNlbGxzO1xuICAgIH07XG5cbiAgICBwcm90by5fbmVpZ2hib3JzID0gZnVuY3Rpb24gX25laWdoYm9ycyh4LHkpe1xuICAgICAgICB2YXIgbiA9IFtdO1xuICAgICAgICBpZiggeCA8IC0xIHx8IHggPiB0aGlzLnNpemVYIHx8IHkgPCAtMSB8fCB5ID4gdGhpcy5zaXplWSl7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgdmFyIG1pblggPSBNYXRoLm1heCgwLHgtMSk7XG4gICAgICAgICAgICB2YXIgbWF4WCA9IE1hdGgubWluKHRoaXMuc2l6ZVgtMSx4KzEpO1xuICAgICAgICAgICAgdmFyIG1pblkgPSBNYXRoLm1heCgwLHktMSk7XG4gICAgICAgICAgICB2YXIgbWF4WSA9IE1hdGgubWluKHRoaXMuc2l6ZVktMSx5KzEpO1xuICAgICAgICAgICAgZm9yKHZhciBueCA9IG1pblg7IG54IDw9IG1heFg7IG54Kyspe1xuICAgICAgICAgICAgICAgIGZvcih2YXIgbnkgPSBtaW5ZOyBueSA8PSBtYXhZOyBueSsrKXtcbiAgICAgICAgICAgICAgICAgICAgaWYobnggIT09IHggfHwgbnkgIT09IHkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgbi5wdXNoKHt4Om54LHk6bnl9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHByb3RvLl9uZWlnaGJvcnNOb0RpYWdzID0gZnVuY3Rpb24oeCx5KXtcbiAgICAgICAgdmFyIG4gPSBbXTtcbiAgICAgICAgaWYoeSA+PSAwICYmIHkgPCB0aGlzLnNpemVZKXtcbiAgICAgICAgICAgIGlmKHgtMSA+PSAwKXtcbiAgICAgICAgICAgICAgICBuLnB1c2goe3g6eC0xLCB5Onl9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHgrMSA8IHRoaXMuc2l6ZVgpe1xuICAgICAgICAgICAgICAgIG4ucHVzaCh7eDp4KzEsIHk6eX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmKCB4ID49IDAgJiYgeCA8IHRoaXMuc2l6ZVggKXtcbiAgICAgICAgICAgIGlmKHktMSA+PSAwKXtcbiAgICAgICAgICAgICAgICBuLnB1c2goe3g6eCwgeTp5LTF9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHkrMSA8IHRoaXMuc2l6ZVkpe1xuICAgICAgICAgICAgICAgIG4ucHVzaCh7eDp4LCB5OnkrMX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuO1xuICAgIH07XG5cbiAgICAvLyByZXR1cm5zIHRoZSBsaXN0IG9mIG5laWdoYm9yaW5nIGNlbGxzIHt4LHksY2VsbH0gb2YgY2VsbCAoeCx5KVxuICAgIC8vIGlmIG5vZGlhZ3MgaXMgdHJ1ZSwgZGlhZ29uYWxzIG5laWdoYm9ycyBhcmUgb21pdHRlZFxuICAgIHByb3RvLm5laWdoYm9ycyA9IGZ1bmN0aW9uIG5laWdoYm9ycyh4LHksbm9kaWFncyl7XG4gICAgICAgIHZhciBuID0gbm9kaWFncyA/IHRoaXMuX25laWdoYm9yc05vRGlhZ3MoeCx5KSA6IHRoaXMuX25laWdoYm9ycyh4LHkpO1xuICAgICAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSBuLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgICAgIG4uY2VsbCA9IHRoaXMuZ2V0Q2VsbFVuc2FmZSh4LHkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuO1xuICAgIH07XG5cblxuICAgIC8qIC0tLSBTZXQgTWFwIGFuZCBIZWFwIGZvciBBKiAtLS0gKi9cblxuICAgIGZ1bmN0aW9uIFBvaW50U2V0KGdyaWQpe1xuICAgICAgICB0aGlzLnNldCA9IFtdO1xuICAgICAgICB0aGlzLnNpemUgPSAwO1xuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xuICAgICAgICB0aGlzLnNpemVYID0gdGhpcy5ncmlkLnNpemVYO1xuICAgICAgICB0aGlzLnNldFt0aGlzLmdyaWQuc2l6ZVggKiB0aGlzLmdyaWQuc2l6ZVldID0gbnVsbDtcbiAgICB9XG4gICAgXG4gICAgUG9pbnRTZXQucHJvdG90eXBlID0ge1xuICAgICAgICBhZGQ6IGZ1bmN0aW9uIGFkZChwb2ludCl7XG4gICAgICAgICAgICB2YXIgaCA9IHBvaW50LnggKyBwb2ludC55ICogdGhpcy5zaXplWDtcbiAgICAgICAgICAgIGlmKCAhdGhpcy5zZXRbaF0gKXtcbiAgICAgICAgICAgICAgICB0aGlzLnNpemUrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2V0W2hdID0gcG9pbnQ7XG4gICAgICAgICAgICByZXR1cm4gaDtcbiAgICAgICAgfSxcbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbiByZW1vdmUocG9pbnQpe1xuICAgICAgICAgICAgdmFyIGggPSBwb2ludC54ICsgcG9pbnQueSAqIHRoaXMuc2l6ZVg7XG4gICAgICAgICAgICBpZih0aGlzLnNldFtoXSl7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRbaF0gPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuc2l6ZS0tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjb250YWluczogZnVuY3Rpb24gY29udGFpbnMocG9pbnQpe1xuICAgICAgICAgICAgcmV0dXJuICEhdGhpcy5zZXRbcG9pbnQueCArIHBvaW50LnkgKiB0aGlzLnNpemVYXTtcbiAgICAgICAgfSxcbiAgICB9O1xuICAgIFxuICAgIGZ1bmN0aW9uIFBvaW50TWFwKGdyaWQpe1xuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xuICAgICAgICB0aGlzLnNpemVYID0gZ3JpZC5zaXplWDtcbiAgICAgICAgdGhpcy5tYXAgPSBbXTtcbiAgICAgICAgdGhpcy5tYXBbdGhpcy5ncmlkLnNpemVYICogdGhpcy5ncmlkLnNpemVZXSA9IG51bGw7XG4gICAgfVxuICAgIFxuICAgIFBvaW50TWFwLnByb3RvdHlwZSA9IHtcbiAgICAgICAgc2V0OiBmdW5jdGlvbiBzZXQocG9pbnQsdmFsdWUpe1xuICAgICAgICAgICAgdGhpcy5tYXBbIHBvaW50LnggKyBwb2ludC55ICogdGhpcy5zaXplWF0gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQocG9pbnQpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFwWyBwb2ludC54ICsgcG9pbnQueSAqIHRoaXMuc2l6ZVhdO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIFBvaW50SGVhcChncmlkKXtcbiAgICAgICAgdGhpcy5jb250ZW50ID0gW107XG4gICAgICAgIHRoaXMuc2V0ID0gbmV3IFBvaW50U2V0KGdyaWQpO1xuICAgIH1cbiAgICBcbiAgICBQb2ludEhlYXAucHJvdG90eXBlID0ge1xuICAgICAgICBhZGQ6IGZ1bmN0aW9uIGFkZChwb2ludCxkaXN0KXtcbiAgICAgICAgICAgIGlmKCF0aGlzLnNldC5jb250YWlucyhwb2ludCkpe1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0LmFkZChwb2ludCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZW50LnB1c2goe2Rpc3Q6ZGlzdCwgcG9pbnQ6cG9pbnR9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9idWJibGVVcCh0aGlzLmNvbnRlbnQubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZShwb2ludCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZW50LnB1c2goe2Rpc3Q6ZGlzdCwgcG9pbnQ6cG9pbnR9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9idWJibGVVcCh0aGlzLmNvbnRlbnQubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHBvcENsb3Nlc3Q6IGZ1bmN0aW9uIHBvcENsb3Nlc3QoKXtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB0aGlzLmNvbnRlbnRbMF07XG4gICAgICAgICAgICB2YXIgZW5kICAgID0gdGhpcy5jb250ZW50LnBvcCgpO1xuICAgICAgICAgICAgaWYodGhpcy5jb250ZW50Lmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGVudFswXSA9IGVuZDtcbiAgICAgICAgICAgICAgICB0aGlzLl9zaW5rRG93bigwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2V0LnJlbW92ZShyZXN1bHQucG9pbnQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcbiAgICAgICAgc2l6ZTogZnVuY3Rpb24gc2l6ZSgpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29udGVudC5sZW5ndGg7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbnRhaW5zOiBmdW5jdGlvbiBjb250YWlucyhwb2ludCl7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZXQuY29udGFpbnMocG9pbnQpO1xuICAgICAgICB9LFxuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKHBvaW50KXtcbiAgICAgICAgICAgIHZhciBsZW4gPSB0aGlzLmNvbnRlbnQubGVuZ3RoO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgICAgICAgICAgaWYodGhpcy5jb250ZW50W2ldLnBvaW50LnggIT09IHBvaW50LnggfHwgdGhpcy5jb250ZW50W2ldLnBvaW50LnkgIT09IHBvaW50Lnkpe1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGVuZCA9IHRoaXMuY29udGVudC5wb3AoKTtcbiAgICAgICAgICAgICAgICBpZiggaSA9PT0gbGVuIC0xKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVuZDtcbiAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250ZW50W2ldID0gZW5kO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9idWJibGVVcChpKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2lua0Rvd24oaSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbmQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBfYnViYmxlVXA6IGZ1bmN0aW9uIF9idWJibGVVcChuKXtcbiAgICAgICAgICAgIHZhciBlbGVtZW50ID0gdGhpcy5jb250ZW50W25dO1xuICAgICAgICAgICAgd2hpbGUoIG4gPiAwICl7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudE4gPSBNYXRoLmZsb29yKChuICsgMSkgLyAyKSAtIDE7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudCAgPSB0aGlzLmNvbnRlbnRbIHBhcmVudE4gXTtcbiAgICAgICAgICAgICAgICBpZihlbGVtZW50LmRpc3QgPj0gcGFyZW50LmRpc3Qpe1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZW50W3BhcmVudE5dID0gZWxlbWVudDtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRlbnRbbl0gPSBwYXJlbnQ7XG4gICAgICAgICAgICAgICAgbiA9IHBhcmVudE47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIF9zaW5rRG93bjogZnVuY3Rpb24gX3NpbmtEb3duKG4pe1xuICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzLmNvbnRlbnRbbl07XG4gICAgICAgICAgICB2YXIgbGVuZ3RoICA9IHRoaXMuY29udGVudC5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSggdHJ1ZSApe1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZDJOID0gKCBuKzEgKSAqIDI7XG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkMU4gPSBjaGlsZDJOIC0gMTtcbiAgICAgICAgICAgICAgICB2YXIgc3dhcCA9IG51bGw7XG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkMSA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICBpZihjaGlsZDFOIDwgbGVuZ3RoICl7IFxuICAgICAgICAgICAgICAgICAgICBjaGlsZDEgPSB0aGlzLmNvbnRlbnRbY2hpbGQxTl07XG4gICAgICAgICAgICAgICAgICAgIGlmKGNoaWxkMS5kaXN0IDwgZWxlbWVudC5kaXN0ICl7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2FwID0gY2hpbGQxTjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmKGNoaWxkMk4gPCBsZW5ndGgpIHsgXG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZDIgPSB0aGlzLmNvbnRlbnRbY2hpbGQyTl07XG4gICAgICAgICAgICAgICAgICAgIGlmKCBjaGlsZDIuZGlzdCA8ICggc3dhcCA9PT0gbnVsbCA/IGVsZW1lbnQuZGlzdCA6IGNoaWxkMS5kaXN0ICkgKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3YXAgPSBjaGlsZDJOO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYoc3dhcCA9PT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRlbnRbbl0gPSB0aGlzLmNvbnRlbnRbc3dhcF07XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZW50W3N3YXBdID0gZWxlbWVudDtcbiAgICAgICAgICAgICAgICBuID0gc3dhcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgIH07XG4gICAgXG5cbiAgICBmdW5jdGlvbiByZWNvbnN0cnVjdF9wYXRoKGNhbWVfZnJvbSwgZW5kKXtcbiAgICAgICAgdmFyIHBhdGggPSBbXTtcbiAgICAgICAgdmFyIGN1cnJlbnQgPSBlbmQ7XG4gICAgICAgIHdoaWxlKGN1cnJlbnQpe1xuICAgICAgICAgICAgcGF0aC5wdXNoKGN1cnJlbnQpO1xuICAgICAgICAgICAgY3VycmVudCA9IGNhbWVfZnJvbS5nZXQoY3VycmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhdGgucmV2ZXJzZSgpO1xuICAgIH1cbiAgICBcbiAgICAvLyBpdGVyYXRlcyBvdmVyIHRoZSBjZWxscyBjcmVhdGluZyB0aGUgc2hvcnRlc3QgcGFzdCBmcm9tIChzdGFydFgsc3RhcnRZKVxuICAgIC8vIHRvIChlbmRYLGVuZFkpIGJ5IGNhbGxpbmcgdGhlIChvcHRpb25hbCkgaXRlcmF0b3IgZnVuY3Rpb24gXG4gICAgLy8gaXRlcmF0b3IoeCx5LGNlbGwpLCBhbmQgdGhlbiByZXR1cm5pbmcgdGhlIHBhdGggYXMgbGlzdCBbe3gseSxjZWxsfSwuLl1cbiAgICAvLyB0aGUgZm9sbHdpbmcgb3B0aW9ucyBjYW4gYmUgcHJvdmlkZWQ6XG4gICAgLy8gb3B0czoge1xuICAgIC8vICAgZGlzdDogYSBjdXN0b20gZGlzdGFuY2UgZnVuY3Rpb24oeDEseTEseDIseTIpIC0+IGZsb2F0IHRoYXQgY29tcHV0ZXMgXG4gICAgLy8gICAgICAgICB0aGUgZGlzdGFuY2UgYmV0d2VlbiBjZWxscy4gVGhpcyBmdW5jdGlvbiBpcyBleGVjdXRlZCBhcyBhIGdyaWRcbiAgICAvLyAgICAgICAgIG1ldGhvZCBhbmQgaXMgdXNlZCB0byBjb21wdXRlIHRoZSBsZW5ndGggb2YgdGhlIHBhdGguIElmIG5vbmUgaXNcbiAgICAvLyAgICAgICAgIGdpdmVuIHRoZSBncmlkJ3MgZGlzdCBtZXRob2QgaXMgdXNlZC5cbiAgICAvL1xuICAgIC8vICAgaGV1cmlzdGljOiBhIGN1c3RvbSBkaXN0YW5jZSBmdW5jdGlvbih4MSx5MSx4Mix5MikgLT4gZmxvYXQgdGhhdFxuICAgIC8vICAgICAgICAgY29tcHV0ZXMgdGhlIEEqIGhldXJpc3RpYy4gYnkgZGVmYXVsdCB0aGUgZ3JpZCdzIGRpc3QgbWV0aG9kIGlzIHVzZWQuXG4gICAgLy8gICAgICAgICBpZiB0aGUgaGV1cmlzdGljIGlzIG5vdCBhbHdheXMgc21hbGxlciBvciBlcXVhbCB0aGFuIGRpc3QoKSwgYW5cbiAgICAvLyAgICAgICAgIG9wdGltYWwgcGF0aCBpcyBub3QgZ3VhcmFudGVlZC5cbiAgICAvLyAgICAgICAgIFxuICAgIC8vICAgbmVpZ2hib3JzIDogYSBmdW5jdGlvbih4LHkpIHRoYXQgcmV0dXJucyB0aGUgbGlzdCBbe3gseX0sLi5dIG9mIFxuICAgIC8vICAgICAgICAgICAgICAgbmVpZ2hib3JpbmcgY2VsbHMgZnJvbSBjZWxsICh4LHkpIGFuZCBpcyB1c2VkIHRvIGRldGVybWluZSB0aGVcbiAgICAvLyAgICAgICAgICAgICAgIGFsbG93ZWQgbW92ZXMgZnJvbSBvbmUgY2VsbCB0byB0aGUgb3RoZXIgaW4gdGhlIHBhdGguIFxuICAgIC8vXG4gICAgLy8gICBub2RpYWdzOiBpZiB0cnVlIGFuZCB0aGUgZGVmYXVsdCBuZWlnaGJvciBtZXRob2QgaXMgdXNlZCwgdGhlbiBkaWFnb25hbHNcbiAgICAvLyAgICAgICAgICAgIG5laWdoYm9ycyBhcmUgaWdub3JlZFxuICAgIC8vXG4gICAgLy8gICBpc1NvbGlkOiBhIGZ1bmN0aW9uKHgseSkgLT4gYm9vbCB0aGF0IHJldHVybnMgdHJ1ZSB3aGVuIHRoZSBjZWxsICh4LHkpXG4gICAgLy8gICAgICAgICAgICBzaG91bGQgYmUgZXhjbHVkZWQgZnJvbSB0aGUgcGF0aC4gQnkgZGVmYXVsdCwgdGhlIGdyaWQncyBpc1NvbGlkXG4gICAgLy8gICAgICAgICAgICBtZXRob2QgaXMgdXNlZC5cblxuICAgIHByb3RvLnBhdGggPSBmdW5jdGlvbiBwYXRoKCBzdGFydFgsIHN0YXJ0WSwgZW5kWCwgZW5kWSwgb3B0cywgaXRlcmF0b3Ipe1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmKHR5cGVvZiBvcHRzID09PSAnZnVuY3Rpb24nKXtcbiAgICAgICAgICAgIGl0ZXJhdG9yID0gb3B0cztcbiAgICAgICAgICAgIG9wdHMgPSB7fTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG5cbiAgICAgICAgdmFyIHN0YXJ0ID0ge3g6c3RhcnRYLCB5OnN0YXJ0WX07XG4gICAgICAgIHZhciBlbmQgICA9IHt4OmVuZFgsICAgeTplbmRZfTsgXG4gICAgICAgIHZhciBfZGlzdCA9IG9wdHMuZGlzdCB8fCB0aGlzLmRpc3Q7XG4gICAgICAgIHZhciBkaXN0ID0gZnVuY3Rpb24oc3RhcnQsZW5kKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2Rpc3QuY2FsbChzZWxmLCBzdGFydC54LHN0YXJ0LnksIGVuZC54LGVuZC55KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIHZhciBfaGV1cmlzdGljID0gb3B0cy5oZXVyaXN0aWMgfHwgdGhpcy5kaXN0O1xuICAgICAgICB2YXIgaGV1cmlzdGljID0gZnVuY3Rpb24oc3RhcnQsIGVuZCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9oZXVyaXN0aWMuY2FsbChzZWxmLHN0YXJ0LngsIHN0YXJ0LnksIGVuZC54LCBlbmQueSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIHZhciBnZXRfbmVpZ2hib3JzID0gb3B0cy5uZWlnaGJvcnMgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKHgseSl7IHJldHVybiBvcHRzLm5laWdoYm9ycy5jYWxsKHNlbGYseCx5KTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA6ICggb3B0cy5ub2RpYWdzID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKHgseSl7IHJldHVybiBzZWxmLl9uZWlnaGJvcnNOb0RpYWdzKHgseSk7fSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGZ1bmN0aW9uKHgseSl7IHJldHVybiBzZWxmLl9uZWlnaGJvcnMoeCx5KTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgIFxuICAgICAgICB2YXIgaXNfc29saWQgPSBvcHRzLmlzU29saWQgP1xuICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbih4LHkpIHsgcmV0dXJuIG9wdHMuaXNTb2xpZC5jYWxsKHNlbGYseCx5KTsgfVxuICAgICAgICAgICAgICAgICAgICAgOiBmdW5jdGlvbih4LHkpIHsgcmV0dXJuIHNlbGYuaXNTb2xpZCh4LHkpOyB9O1xuXG4gICAgICAgIHZhciBjbG9zZWRzZXQgPSBuZXcgUG9pbnRTZXQodGhpcyk7XG4gICAgICAgIHZhciBvcGVuc2V0ICAgPSBuZXcgUG9pbnRIZWFwKHRoaXMpO1xuICAgICAgICAgICAgb3BlbnNldC5hZGQoe3g6c3RhcnRYLCB5OnN0YXJ0WX0sMCArIGhldXJpc3RpYyhzdGFydCxlbmQpKTtcbiAgICAgICAgdmFyIGNhbWVfZnJvbSA9IG5ldyBQb2ludE1hcCh0aGlzKTtcbiAgICAgICAgdmFyIGdfc2NvcmUgICA9IG5ldyBQb2ludE1hcCh0aGlzKTtcbiAgICAgICAgICAgIGdfc2NvcmUuc2V0KHN0YXJ0LDApO1xuXG4gICAgICAgIHdoaWxlKCBvcGVuc2V0LnNpemUoKSA+IDAgKXtcbiAgICAgICAgICAgIHZhciBjdXJyZW50ID0gb3BlbnNldC5wb3BDbG9zZXN0KCkucG9pbnQ7IFxuXG4gICAgICAgICAgICBpZiggY3VycmVudC54ID09PSBlbmRYICYmIGN1cnJlbnQueSA9PT0gZW5kWSl7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVjb25zdHJ1Y3RfcGF0aChjYW1lX2Zyb20sIGVuZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNsb3NlZHNldC5hZGQoY3VycmVudCk7IFxuXG4gICAgICAgICAgICB2YXIgbmVpZ2hib3JzID0gZ2V0X25laWdoYm9ycyhjdXJyZW50LngsIGN1cnJlbnQueSk7IC8vZ2V0X25laWdoYm9ycy5jYWxsKHRoaXMsY3VycmVudC54LGN1cnJlbnQueSk7XG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSBuZWlnaGJvcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBuZWlnaGJvciA9IG5laWdoYm9yc1tpXTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZihpc19zb2xpZChuZWlnaGJvci54LCBuZWlnaGJvci55KSB8fCBjbG9zZWRzZXQuY29udGFpbnMobmVpZ2hib3IpKXtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHRlbnRhdGl2ZV9nX3Njb3JlID0gZ19zY29yZS5nZXQoY3VycmVudCkgKyBkaXN0KGN1cnJlbnQsbmVpZ2hib3IpO1xuXG4gICAgICAgICAgICAgICAgaWYoICFvcGVuc2V0LmNvbnRhaW5zKG5laWdoYm9yKSB8fCB0ZW50YXRpdmVfZ19zY29yZSA8IGdfc2NvcmUuZ2V0KG5laWdoYm9yKSApe1xuICAgICAgICAgICAgICAgICAgICBjYW1lX2Zyb20uc2V0KG5laWdoYm9yLCBjdXJyZW50KTtcbiAgICAgICAgICAgICAgICAgICAgZ19zY29yZS5zZXQobmVpZ2hib3IsIHRlbnRhdGl2ZV9nX3Njb3JlKTtcbiAgICAgICAgICAgICAgICAgICAgb3BlbnNldC5hZGQobmVpZ2hib3IsIHRlbnRhdGl2ZV9nX3Njb3JlICsgaGV1cmlzdGljKG5laWdoYm9yLCBlbmQpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYoaXRlcmF0b3Ipe1xuICAgICAgICAgICAgZm9yKHZhciBqID0gMCwgamxlbiA9IHJlc3VsdC5sZW5ndGg7IGogPCBqbGVuOyBqKyspe1xuICAgICAgICAgICAgICAgIHZhciByID0gcmVzdWx0W2pdO1xuICAgICAgICAgICAgICAgICAgICByLmNlbGwgPSB0aGlzLmdldENlbGxVbnNhZmUoci54LHIueSk7XG4gICAgICAgICAgICAgICAgaXRlcmF0b3IuY2FsbCh0aGlzLHIueCxyLnksci5jZWxsLGosamxlbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuXG4gICAgLy8gcmV0dXJucyB0aGUgcGl4ZWwgY29vcmRpbmF0ZXMge3gseX0gb2YgdGhlIGZpcnN0IGludGVyc2VjdGlvblxuICAgIC8vIG9mIHRoZSByYXkgc3RhcnRpbmcgYXQgcGl4ZWwgKE94LE95KSBpbiB0aGUgZGlyZWN0aW9uIChSeCxSeSkgXG4gICAgLy8gd2l0aCB0aGUgYXhpcyBhbGlnbmVkIGJveCBvZiBzaXplIChic3gsYnN5KSBwaXhlbHMsIHdpdGggdGhlXG4gICAgLy8gY29ybmVyIHdpdGggdGhlIHNtYWxsZXN0IHBpeGVsIGNvb3JkaW5hdGVzIChieCxieSlcbiAgICAvLyBcbiAgICAvLyBUaGUgcmF5IGNhbiBpbnRlcnNlY3QgdGhlIGJveCBmcm9tIHRoZSBpbnNpZGUuXG4gICAgLy8gSWYgbm8gaW50ZXJzZWN0aW9uIGlzIGZvdW5kLCBpdCByZXR1cm5zIHVuZGVmaW5lZFxuXG4gICAgZnVuY3Rpb24gcmF5SW50ZXJzZWN0Qm94KE94LE95LFJ4LFJ5LGJ4LGJ5LGJzeCwgYnN5KXtcbiAgICAgICAgLy8gaHR0cDovL3d3dy5zY3JhdGNoYXBpeGVsLmNvbS9sZXNzb25zLzNkLWJhc2ljLWxlc3NvbnMvbGVzc29uLTctaW50ZXJzZWN0aW5nLXNpbXBsZS1zaGFwZXMvcmF5LWJveC1pbnRlcnNlY3Rpb24vXG4gICAgICAgIHZhciBtaW54ID0gYng7XG4gICAgICAgIHZhciBtaW55ID0gYnk7XG4gICAgICAgIHZhciBtYXh4ID0gYngrYnN4O1xuICAgICAgICB2YXIgbWF4eSA9IGJ5K2JzeTtcbiAgICAgICAgdmFyIGlSeCA9IDEuMC9SeDtcbiAgICAgICAgdmFyIGlSeSA9IDEuMC9SeTtcbiAgICAgICAgdmFyIHRtaW54LCB0bWF4eCwgdG1pbnksIHRtYXh5O1xuXG4gICAgICAgIGlmKCBpUnggPj0gMCApe1xuICAgICAgICAgICAgdG1pbnggPSAoIG1pbnggLSBPeCkgKiBpUng7XG4gICAgICAgICAgICB0bWF4eCA9ICggbWF4eCAtIE94KSAqIGlSeDtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICB0bWlueCA9ICggbWF4eCAtIE94KSAqIGlSeDtcbiAgICAgICAgICAgIHRtYXh4ID0gKCBtaW54IC0gT3gpICogaVJ4O1xuICAgICAgICB9XG4gICAgICAgIGlmKCBpUnkgPj0gMCApe1xuICAgICAgICAgICAgdG1pbnkgPSAoIG1pbnkgLSBPeSkgKiBpUnk7XG4gICAgICAgICAgICB0bWF4eSA9ICggbWF4eSAtIE95KSAqIGlSeTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICB0bWlueSA9ICggbWF4eSAtIE95KSAqIGlSeTtcbiAgICAgICAgICAgIHRtYXh5ID0gKCBtaW55IC0gT3kpICogaVJ5O1xuICAgICAgICB9XG4gICAgICAgIGlmKCB0bWlueCA+IHRtYXh5IHx8IHRtaW55ID4gdG1heHggKXtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHRtaW4gID0gKHRtaW55ID4gdG1pbnggfHwgdG1pbnggIT09IHRtaW54KSA/IHRtaW55IDogdG1pbng7IC8vTWF0aC5tYXgodG1pbngsdG1pbnkpO1xuICAgICAgICB2YXIgdG1heCAgPSAodG1heHkgPCB0bWF4eCB8fCB0bWF4eCAhPT0gdG1heHgpID8gdG1heHkgOiB0bWF4eDsgLy9NYXRoLm1pbih0bWF4eCx0bWF4eSk7XG4gICAgICAgIGlmKCB0bWF4IDw9IDAgKXtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1lbHNlIGlmKCB0bWluIDw9IDApe1xuICAgICAgICAgICAgcmV0dXJuIHt4OiBPeCt0bWF4KlJ4LCB5Ok95K3RtYXgqUnl9O1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHJldHVybiB7eDogT3grdG1pbipSeCwgeTpPeSt0bWluKlJ5fTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIHJldHVybnMgdGhlIHBpeGVsIGNvb3JkaW5hdGVzIHt4LHl9IG9mIHRoZSBmaXJzdCBpbnRlcnNlY3Rpb25cbiAgICAvLyBvZiB0aGUgcmF5IHN0YXJ0aW5nIGF0IHBpeGVsIChzdGFydFgsc3RhcnRZKSBpbiB0aGUgZGlyZWN0aW9uIFxuICAgIC8vIChkaXJYLGRpclkpIHdpdGggdGhlIGJvdW5kYXJpZXMgb2YgdGhlIGNlbGwgKGNlbGxYLGNlbGxZKVxuICAgIC8vXG4gICAgLy8gLSBUaGUgcmF5IGNhbiBpbnRlcnNlY3QgdGhlIGJveCBmcm9tIHRoZSBpbnNpZGUuXG4gICAgLy8gLSBJZiBubyBpbnRlcnNlY3Rpb24gaXMgZm91bmQsIGl0IHJldHVybnMgdW5kZWZpbmVkXG5cbiAgICBwcm90by5yYXlJbnRlcnNlY3RDZWxsID0gZnVuY3Rpb24oc3RhcnRYLHN0YXJ0WSxkaXJYLGRpclksY2VsbFgsY2VsbFkpe1xuICAgICAgICByZXR1cm4gcmF5SW50ZXJzZWN0Qm94KHN0YXJ0WCxzdGFydFksZGlyWCxkaXJZLGNlbGxYKnRoaXMuY2VsbFNpemVYLGNlbGxZKnRoaXMuY2VsbFNpemVZLHRoaXMuY2VsbFNpemVYLHRoaXMuY2VsbFNpemVZKTtcbiAgICB9O1xuXG4gICAgLy8gaXRlcmF0ZXMgb3ZlciB0aGUgZ3JpZCdzIGNlbGxzIGNvbnRhaW5pbmcgdGhlIHJheSBzdGFydGluZyBhdFxuICAgIC8vIHBpeGVsIChzdGFydFgsc3RhcnR5KSBpbiB0aGUgZGlyZWN0aW9uIChkaXJYLGRpclkpIGluIHRoZSBvcmRlclxuICAgIC8vIG9mIGludGVyc2VjdGlvbiwgYnkgY2FsbGluZyB0aGUgaXRlcmF0b3IgZnVuY3Rpb24gXG4gICAgLy8gICAgaXRlcmF0b3IoeCx5LGNlbGwsIGluWCxpblksIG91dFgsb3V0WSkgLT4gYm9vbFxuICAgIC8vIHN0b3BwaW5nIHdoZW4gaXQgcmV0dXJucyB0cnVlLlxuICAgIC8vIChpblgsaW5ZKSwgKG91dFgsb3V0WSkgYXJlIHRoZSBwaXhlbCBjb29yZGluYXRlcyBvZiB0aGUgZW50cnkgYW5kIGV4aXRcbiAgICAvLyBwb2ludHMgb2YgdGhlIHJheSBpbiB0aGUgY2VsbC5cbiAgICAvL1xuICAgIC8vIC0gc3RhcnQgcG9zaXRpb24gbWF5IGxpZSBvdXRzaWRlIHRoZSBncmlkLlxuICAgIHByb3RvLnJheXRyYWNlID0gZnVuY3Rpb24oc3RhcnRYLCBzdGFydFksIGRpclgsIGRpclksIGl0ZXJhdG9yKXtcbiAgICAgICAgXG4gICAgICAgIC8vIGh0dHA6Ly93d3cueG5hd2lraS5jb20vaW5kZXgucGhwP3RpdGxlPVZveGVsX3RyYXZlcnNhbFxuXG4gICAgICAgIGlmKCF0aGlzLnBpeGVsSW5zaWRlKHN0YXJ0WCxzdGFydFkpKXtcbiAgICAgICAgICAgIHZhciBzdGFydCA9IHJheUludGVyc2VjdEJveChzdGFydFgsc3RhcnRZLGRpclgsZGlyWSwwLDAsdGhpcy5jZWxsU2l6ZVgqdGhpcy5zaXplWCwgdGhpcy5jZWxsU2l6ZVkqdGhpcy5zaXplWSk7XG4gICAgICAgICAgICBpZighc3RhcnQpe1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0YXJ0WCA9IHN0YXJ0Lng7XG4gICAgICAgICAgICBzdGFydFkgPSBzdGFydC55O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIFJ4ID0gZGlyWCAvIHRoaXMuY2VsbFNpemVYO1xuICAgICAgICB2YXIgUnkgPSBkaXJZIC8gdGhpcy5jZWxsU2l6ZVk7XG4gICAgICAgIHZhciBpUnggPSAxLjAgLyBSeDtcbiAgICAgICAgdmFyIGlSeSA9IDEuMCAvIFJ5O1xuICAgICAgICB2YXIgWCAgPSBNYXRoLmZsb29yKHN0YXJ0WCk7XG4gICAgICAgICAgICBYICA9IFggPj0gdGhpcy5zaXplWCA/IHRoaXMuc2l6ZVggLSAxIDogWDtcbiAgICAgICAgdmFyIFkgID0gTWF0aC5mbG9vcihzdGFydFkpO1xuICAgICAgICAgICAgWSAgPSBZID49IHRoaXMuc2l6ZVkgPyB0aGlzLnNpemVZIC0gMSA6IFk7XG4gICAgICAgIHZhciBzdGVwWCA9IFJ4ID09PSAwID8gMSA6IChSeCA+IDAgPyAxOiAtMSk7XG4gICAgICAgIHZhciBzdGVwWSA9IFJ5ID09PSAwID8gMSA6IChSeSA+IDAgPyAxOiAtMSk7XG4gICAgICAgIHZhciBib3VuZFggPSBYICsgKHN0ZXBYID4gMCA/IDEgOiAwKTtcbiAgICAgICAgdmFyIGJvdW5kWSA9IFkgKyAoc3RlcFkgPiAwID8gMSA6IDApO1xuICAgICAgICB2YXIgdG1heFggPSAoYm91bmRYIC0gc3RhcnRYKSAqIGlSeCA7XG4gICAgICAgICAgICB0bWF4WCA9ICh0bWF4WCAhPT0gdG1heFgpID8gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZIDogdG1heFg7XG4gICAgICAgIHZhciB0bWF4WSA9IChib3VuZFkgLSBzdGFydFkpICogaVJ5O1xuICAgICAgICAgICAgdG1heFkgPSAodG1heFkgIT09IHRtYXhZKSA/IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSA6IHRtYXhZO1xuICAgICAgICB2YXIgdGRlbHRhWCAgPSBzdGVwWCAqIGlSeDtcbiAgICAgICAgICAgIHRkZWx0YVggID0gKHRkZWx0YVggIT09IHRkZWx0YVgpID8gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZIDogdGRlbHRhWDtcbiAgICAgICAgdmFyIHRkZWx0YVkgID0gc3RlcFkgKiBpUnk7XG4gICAgICAgICAgICB0ZGVsdGFZICA9ICh0ZGVsdGFZICE9PSB0ZGVsdGFZKSA/IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSA6IHRkZWx0YVk7XG4gICAgICAgIHZhciBjdXJyWCA9IHN0YXJ0WDtcbiAgICAgICAgdmFyIGN1cnJZID0gc3RhcnRZO1xuICAgICAgICB2YXIgbmV4dFggPSBzdGFydFg7XG4gICAgICAgIHZhciBuZXh0WSA9IHN0YXJ0WTtcbiAgICAgICAgZG97XG4gICAgICAgICAgICB2YXIgY1ggPSBYO1xuICAgICAgICAgICAgdmFyIGNZID0gWTtcbiAgICAgICAgICAgIGlmICh0bWF4WCA8IHRtYXhZKXtcbiAgICAgICAgICAgICAgICBYICs9IHN0ZXBYO1xuICAgICAgICAgICAgICAgIG5leHRYICA9IHN0YXJ0WCArIHRtYXhYICogZGlyWDtcbiAgICAgICAgICAgICAgICB0bWF4WCArPSB0ZGVsdGFYO1xuICAgICAgICAgICAgfWVsc2UgaWYodG1heFggPiB0bWF4WSl7XG4gICAgICAgICAgICAgICAgWSArPSBzdGVwWTtcbiAgICAgICAgICAgICAgICBuZXh0WSAgPSBzdGFydFggKyB0bWF4WSAqIGRpclk7XG4gICAgICAgICAgICAgICAgdG1heFkgKz0gdGRlbHRhWTtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIFggKz0gc3RlcFg7XG4gICAgICAgICAgICAgICAgWSArPSBzdGVwWTtcbiAgICAgICAgICAgICAgICBuZXh0WCAgPSBzdGFydFggKyB0bWF4WCAqIGRpclg7XG4gICAgICAgICAgICAgICAgbmV4dFkgID0gc3RhcnRYICsgdG1heFkgKiBkaXJZO1xuICAgICAgICAgICAgICAgIHRtYXhYICs9IHRkZWx0YVg7XG4gICAgICAgICAgICAgICAgdG1heFkgKz0gdGRlbHRhWTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGl0ZXJhdG9yLmNhbGwodGhpcywgY1gsY1ksIHRoaXMuZ2V0Q2VsbFVuc2FmZShjWCxjWSksIGN1cnJYLCBjdXJyWSwgbmV4dFgsIG5leHRZKSl7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXJyWCA9IG5leHRYO1xuICAgICAgICAgICAgY3VyclkgPSBuZXh0WTtcbiAgICAgICAgfXdoaWxlKHRoaXMuY2VsbEluc2lkZShYLFkpKTtcblxuICAgIH07XG5cbiAgICAvLyByZXR1cm5zIHRoZSBzaG9ydGVzdCB0cmFuc2xhdGlvbiB2ZWN0b3IgdGhhdCBjYW4gdHJhbnNsYXRlXG4gICAgLy8gdGhlIGJveCB3aXRoIG1pbmltdW0gcGl4ZWwgY29vcmRpbmF0ZXMgKG1pblgsbWluWSkgYW5kXG4gICAgLy8gbWF4aW11bSBwaXhlbCBjb29yZGluYXRlcyAobWF4WCxtYXhZKSBzbyB0aGF0IHRoZSBib3ggZG9lc24ndFxuICAgIC8vIGNvbGxpZGVzIHdpdGggYW55IHNvbGlkIGNlbGwuXG4gICAgLy9cbiAgICAvLyBpZiBubyB0cmFuc2xhdGlvbiBpcyBuZWVkZWQsIGl0IHJldHVybnMgdW5kZWZpbmVkLlxuICAgIC8vXG4gICAgLy8gdGhlIGZvbGxvd2luZyBvcHRpb25zIGNhbiBiZSBwcml2aWRlZDpcbiAgICAvLyBvcHRzIDoge1xuICAgIC8vICAgaXNTb2xpZCA6IGZ1bmN0aW9uKHgseSkgLT4gYm9vbCA6IHRoYXQgcmV0dXJucyB0cnVlIHdoZW4gY2VsbFxuICAgIC8vICAgICAgICAgICAgICh4LHkpIG11c3QgYmUgY29uc2lkZXJlZCBhcyBzb2xpZC4gSWYgbm90IHByb3ZpZGVkLFxuICAgIC8vICAgICAgICAgICAgIHRoZSBncmlkJ3MgaXNTb2xpZCBtZXRob2QgaXMgdXNlZC5cbiAgICAvLyB9XG4gICAgcHJvdG8uY29sbGlzaW9uVmVjdG9yID0gIGZ1bmN0aW9uKG1pblgsbWluWSxtYXhYLG1heFksb3B0cyl7XG4gICAgICAgIHZhciBzZWxmICA9IHRoaXM7XG4gICAgICAgICAgICBvcHRzICA9IG9wdHMgfHwge307XG5cbiAgICAgICAgdmFyIHN4ICAgID0gbWF4WCAtIG1pblg7XG4gICAgICAgIHZhciBzeSAgICA9IG1heFkgLSBtaW5ZO1xuIFxuICAgICAgICB2YXIgY3ggICAgPSB0aGlzLnNpemVYO1xuICAgICAgICB2YXIgY3kgICAgPSB0aGlzLnNpemVZO1xuICAgICAgICB2YXIgY3N4ICAgPSB0aGlzLmNlbGxTaXplWDtcbiAgICAgICAgdmFyIGNzeSAgID0gdGhpcy5jZWxsU2l6ZVk7XG5cbiAgICAgICAgaWYobWF4WCA8PSAwIHx8IG1heFkgPD0gMCB8fCBtaW5YID49IGN4KmNzeCB8fCBtaW5ZID49IGN5KmNzeSl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaXNfc29saWQgID0gb3B0cy5pc1NvbGlkID9cbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKHgseSl7IHJldHVybiBvcHRzLnNvbGlkaXR5LmNhbGwodGhpcyx4LHkpOyB9XG4gICAgICAgICAgICAgICAgICAgICAgOiBmdW5jdGlvbih4LHkpeyByZXR1cm4gc2VsZi5pc1NvbGlkKHgseSk7IH07XG5cbiAgICAgICAgLy93ZSB0cmFuc2Zvcm0gZXZlcnl0aGluZyBzbyB0aGF0IHRoZSBjZWxscyBhcmUgc3F1YXJlcyBvZiBzaXplIDEuXG5cbiAgICAgICAgdmFyIGlzeCAgID0gMSAvIGNzeDtcbiAgICAgICAgdmFyIGlzeSAgID0gMSAvIGNzeTtcblxuICAgICAgICBtaW5YICo9IGlzeDtcbiAgICAgICAgbWluWSAqPSBpc3k7XG4gICAgICAgIG1heFggKj0gaXN4O1xuICAgICAgICBtYXhZICo9IGlzeTtcblxuICAgICAgICB2YXIgbWluX3B4ID0gTWF0aC5mbG9vcihtaW5YKTtcbiAgICAgICAgdmFyIG1heF9weCA9IE1hdGguZmxvb3IobWF4WCk7XG4gICAgICAgIHZhciBtaW5fcHkgPSBNYXRoLmZsb29yKG1pblkpO1xuICAgICAgICB2YXIgbWF4X3B5ID0gTWF0aC5mbG9vcihtYXhZKTtcblxuICAgICAgICAvLyB0aGVzZSBhcmUgdGhlIGRpc3RhbmNlcyB0aGUgZW50aXR5IHNob3VsZCBiZSBkaXNwbGFjZWQgdG8gZXNjYXBlXG4gICAgICAgIC8vIGxlZnQgYmxvY2tzLCByaWdodCBibG9ja3MsIHVwIC4uLiBcblxuICAgICAgICB2YXIgZXNjX2wgPSAobWluX3B4ICsgMSAtIG1pblgpICogY3N4O1xuICAgICAgICB2YXIgZXNjX3IgPSAtKCBtYXhYIC0gbWF4X3B4ICkgICogY3N4OyAgXG4gICAgICAgIHZhciBlc2NfdSA9IChtaW5fcHkgKyAxIC0gbWluWSkgKiBjc3k7XG4gICAgICAgIHZhciBlc2NfZCA9IC0oIG1heFkgLSBtYXhfcHkgKSAgKiBjc3k7XG5cbiAgICAgICAgdmFyIGR4ID0gMCwgZHkgPSAwO1xuXG4gICAgICAgIC8vIGF0IHRoaXMgcG9pbnQgd2UgYXJlIGJhY2sgaW4gd29ybGQgc2l6ZXMgXG5cbiAgICAgICAgaWYobWluX3B4ID09PSBtYXhfcHggJiYgbWluX3B5ID09PSBtYXhfcHkpe1xuICAgICAgICAgICAgLy8gaW4gdGhlIG1pZGRsZSBvZiBvbmUgYmxvY2tcbiAgICAgICAgICAgIGlmKGlzX3NvbGlkKG1pbl9weCxtaW5fcHkpKXtcbiAgICAgICAgICAgICAgICBkeCA9IGVzY19sIDwgLWVzY19yID8gZXNjX2wgOiBlc2NfcjtcbiAgICAgICAgICAgICAgICBkeSA9IGVzY191IDwgLWVzY19kID8gZXNjX3UgOiBlc2NfZDtcbiAgICAgICAgICAgICAgICBpZihNYXRoLmFicyhkeCkgPCBNYXRoLmFicyhkeSkpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge3g6ZHgsIHk6MH07XG4gICAgICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7eDowLCB5OmR5fTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9ZWxzZSBpZihtaW5fcHggPT09IG1heF9weCl7XG4gICAgICAgICAgICAvLyBpbiB0aGUgbWlkZGxlIG9mIG9uZSB2ZXJ0aWNhbCB0d28tYmxvY2sgcmVjdGFuZ2xlXG4gICAgICAgICAgICB2YXIgc29saWRfdSA9IGlzX3NvbGlkKG1pbl9weCxtaW5fcHkpO1xuICAgICAgICAgICAgdmFyIHNvbGlkX2QgPSBpc19zb2xpZChtaW5fcHgsbWF4X3B5KTtcbiAgICAgICAgICAgIGlmKHNvbGlkX3UgJiYgc29saWRfZCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDsgLy8gZXJyb3JcbiAgICAgICAgICAgIH1lbHNlIGlmKHNvbGlkX3Upe1xuICAgICAgICAgICAgICAgIHJldHVybiB7eDowLCB5OmVzY191fTtcbiAgICAgICAgICAgIH1lbHNlIGlmKHNvbGlkX2Qpe1xuICAgICAgICAgICAgICAgIHJldHVybiB7eDowLCB5OmVzY19kfTtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1lbHNlIGlmKG1pbl9weSA9PT0gbWF4X3B5KXtcbiAgICAgICAgICAgIC8vIGluIHRoZSBtaWRkbGUgb2Ygb25lIGhvcml6b250YWwgdHdvLWJsb2NrIHJlY3RhbmdsZVxuICAgICAgICAgICAgdmFyIHNvbGlkX2wgPSBpc19zb2xpZChtaW5fcHgsbWluX3B5KTtcbiAgICAgICAgICAgIHZhciBzb2xpZF9yID0gaXNfc29saWQobWF4X3B4LG1pbl9weSk7XG4gICAgICAgICAgICBpZihzb2xpZF9sICYmIHNvbGlkX3Ipe1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7IC8vIGVycm9yXG4gICAgICAgICAgICB9ZWxzZSBpZihzb2xpZF9sKXtcbiAgICAgICAgICAgICAgICByZXR1cm4ge3g6ZXNjX2wsIHk6MH07XG4gICAgICAgICAgICB9ZWxzZSBpZihzb2xpZF9yKXtcbiAgICAgICAgICAgICAgICByZXR1cm4ge3g6ZXNjX3IsIHk6MH07XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIC8vIHRvdWNoaW5nIGZvdXIgYmxvY2tzXG4gICAgICAgICAgICB2YXIgc29saWRfdWwgPSBpc19zb2xpZChtaW5fcHgsbWluX3B5KTtcbiAgICAgICAgICAgIHZhciBzb2xpZF91ciA9IGlzX3NvbGlkKG1heF9weCxtaW5fcHkpO1xuICAgICAgICAgICAgdmFyIHNvbGlkX2RsID0gaXNfc29saWQobWluX3B4LG1heF9weSk7XG4gICAgICAgICAgICB2YXIgc29saWRfZHIgPSBpc19zb2xpZChtYXhfcHgsbWF4X3B5KTtcbiAgICAgICAgICAgIHZhciBjb3VudCA9IDAgKyBzb2xpZF91bCArIHNvbGlkX3VyICsgc29saWRfZGwgKyBzb2xpZF9kcjtcbiAgICAgICAgICAgIGlmKGNvdW50ID09PSAwKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfWVsc2UgaWYoY291bnQgPT09IDQpe1xuICAgICAgICAgICAgICAgIGlmKCAtZXNjX3IgPCBlc2NfbCl7XG4gICAgICAgICAgICAgICAgICAgIGR4ID0gZXNjX3IgLSBjc3g7XG4gICAgICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgICAgIGR4ID0gZXNjX2wgKyBjc3g7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmKCAtZXNjX2QgPCBlc2NfdSl7XG4gICAgICAgICAgICAgICAgICAgIGR5ID0gZXNjX2QgLSBjc3g7XG4gICAgICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgICAgIGR5ID0gZXNjX3UgKyBjc3g7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmKE1hdGguYWJzKGR4KSA8IE1hdGguYWJzKGR5KSl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7eDpkeCx5OjB9O1xuICAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge3g6MCwgeTpkeX07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfWVsc2UgaWYoY291bnQgPj0gMil7XG4gICAgICAgICAgICAgICAgaWYoc29saWRfdWwgJiYgc29saWRfdXIpe1xuICAgICAgICAgICAgICAgICAgICBkeSA9IGVzY191O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZihzb2xpZF9kbCAmJiBzb2xpZF9kcil7XG4gICAgICAgICAgICAgICAgICAgIGR5ID0gZXNjX2Q7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmKHNvbGlkX2RsICYmIHNvbGlkX3VsKXtcbiAgICAgICAgICAgICAgICAgICAgZHggPSBlc2NfbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYoc29saWRfZHIgJiYgc29saWRfdXIpe1xuICAgICAgICAgICAgICAgICAgICBkeCA9IGVzY19yO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZihjb3VudCA9PT0gMil7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNlbnRlciBvZiB0aGUgYm91bmQgcmVsYXRpdmUgdG8gdGhlIGNlbnRlciBvZiB0aGUgNFxuICAgICAgICAgICAgICAgICAgICAvLyBjZWxscy4gY3kgZ29lcyB1cFxuICAgICAgICAgICAgICAgICAgICBzeCA9IGVzY19sIC0gZXNjX3I7XG4gICAgICAgICAgICAgICAgICAgIHN5ID0gZXNjX3UgLSBlc2NfZDtcbiAgICAgICAgICAgICAgICAgICAgY3ggPSAtZXNjX3IgLSBzeCowLjU7XG4gICAgICAgICAgICAgICAgICAgIGN5ID0gLSgtZXNjX2QgLSBzeSowLjUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmKHNvbGlkX2RyICYmIHNvbGlkX3VsKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFhYWFhcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFhYWFhcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBYWFhYXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgWFhYWFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoY3kgPj0gLWN4KXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkeCA9IGVzY19sO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR5ID0gZXNjX2Q7XG4gICAgICAgICAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkeCA9IGVzY19yO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR5ID0gZXNjX3U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1lbHNlIGlmKHNvbGlkX2RsICYmIHNvbGlkX3VyKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBYWFhYXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgWFhYWFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gWFhYWCBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFhYWFhcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGN5ID49IGN4KXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkeCA9IGVzY19yO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR5ID0gZXNjX2Q7XG4gICAgICAgICAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkeCA9IGVzY19sO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR5ID0gZXNjX3U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHt4OmR4LCB5OmR5fTtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIGlmKHNvbGlkX2RsKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC1lc2NfZCA8IGVzY19sID8gIHt4OjAsIHk6ZXNjX2R9IDoge3g6ZXNjX2wsIHk6MH07XG4gICAgICAgICAgICAgICAgfWVsc2UgaWYoc29saWRfZHIpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLWVzY19kIDwgLWVzY19yID8ge3g6MCwgeTplc2NfZH0gOiB7eDplc2NfciwgeTowfTtcbiAgICAgICAgICAgICAgICB9ZWxzZSBpZihzb2xpZF91cil7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlc2NfdSA8IC1lc2NfciA/ICB7eDowLCB5OmVzY191fSA6IHt4OmVzY19yLCB5OjB9O1xuICAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXNjX3UgPCBlc2NfbCA/ICAge3g6MCwgeTplc2NfdX0gOiB7eDplc2NfbCwgeTowfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG59KSh0eXBlb2YgZXhwb3J0cyA9PT0gJ3VuZGVmaW5lZCcgPyAoIHRoaXMubW9kdWxhIHx8ICh0aGlzLm1vZHVsYSA9IHt9KSkgOiBleHBvcnRzICk7XG5cbiIsIlxuLyogLS0tLS0tIElucHV0IEhhbmRsaW5nIC0tLS0tICovXG5cbihmdW5jdGlvbihtb2R1bGEpe1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIFYyICAgID0gcmVxdWlyZSgnLi9WMi5qcycpLlYyO1xuICAgIFxuICAgIGZ1bmN0aW9uIElucHV0KCl7XG4gICAgICAgIHZhciAgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5zdGF0dXMgICA9IHt9OyAvLyAndXAnICdwcmVzcycgJ2Rvd24nICdyZWxlYXNlJyAncHJlc3NyZWxlYXNlJ1xuICAgICAgICB0aGlzLmV2ZW50cyAgID0gW107XG4gICAgICAgIHRoaXMubm9kZSAgICAgPSBkb2N1bWVudC5ib2R5OyBcbiAgICAgICAgdGhpcy5uZXdQb3MgICA9IFYyKCk7XG4gICAgICAgIHRoaXMucG9zICAgICAgPSBWMigpO1xuICAgICAgICB0aGlzLmRlbHRhUG9zID0gVjIoKTtcblxuICAgICAgICB0aGlzLmhhbmRsZXJLZXl1cCA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgIHNlbGYuZXZlbnRzLnB1c2goe3R5cGU6J3VwJywga2V5OiBTdHJpbmcuZnJvbUNoYXJDb2RlKGV2ZW50LndoaWNoKS50b0xvd2VyQ2FzZSgpfSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuaGFuZGxlcktleWRvd24gPSBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICBzZWxmLmV2ZW50cy5wdXNoKHt0eXBlOidkb3duJywga2V5OiBTdHJpbmcuZnJvbUNoYXJDb2RlKGV2ZW50LndoaWNoKS50b0xvd2VyQ2FzZSgpfSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuaGFuZGxlck1vdXNldXAgPSBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICBzZWxmLmV2ZW50cy5wdXNoKHt0eXBlOid1cCcsIGtleTogJ21vdXNlJytldmVudC5idXR0b259KTsgXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuaGFuZGxlck1vdXNlZG93biA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgIHNlbGYuZXZlbnRzLnB1c2goe3R5cGU6J2Rvd24nLCBrZXk6ICdtb3VzZScrZXZlbnQuYnV0dG9ufSk7IFxuICAgICAgICB9O1xuXG4gICAgICAgIGZ1bmN0aW9uIHBvc2l0aW9uKG5vZGUsZXZlbnQpe1xuICAgICAgICAgICAgdmFyIG9mZnNldFggPSAwO1xuICAgICAgICAgICAgdmFyIG9mZnNldFkgPSAwO1xuXG4gICAgICAgICAgICBkb3tcbiAgICAgICAgICAgICAgICBvZmZzZXRYICs9IG5vZGUub2Zmc2V0TGVmdDtcbiAgICAgICAgICAgICAgICBvZmZzZXRZICs9IG5vZGUub2Zmc2V0VG9wO1xuICAgICAgICAgICAgfXdoaWxlKChub2RlID0gbm9kZS5vZmZzZXRQYXJlbnQpKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIFYyKGV2ZW50LnBhZ2VYIC0gb2Zmc2V0WCwgZXZlbnQucGFnZVkgLSBvZmZzZXRZKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaGFuZGxlck1vdXNlbW92ZSA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgIHNlbGYubmV3UG9zID0gcG9zaXRpb24odGhpcyxldmVudCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJyx0aGlzLmhhbmRsZXJLZXl1cCk7XG4gICAgICAgIHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJyx0aGlzLmhhbmRsZXJLZXlkb3duKTtcbiAgICAgICAgdGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLHRoaXMuaGFuZGxlck1vdXNldXApO1xuICAgICAgICB0aGlzLm5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJyx0aGlzLmhhbmRsZXJNb3VzZWRvd24pO1xuICAgICAgICB0aGlzLm5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJyx0aGlzLmhhbmRsZXJNb3VzZW1vdmUpO1xuICAgIH1cblxuICAgIElucHV0LnByb3RvdHlwZSA9IHtcbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICB2YXIgdHJhbnNpdGlvbiA9IHtcbiAgICAgICAgICAgICAgICAndXAnOid1cCcsXG4gICAgICAgICAgICAgICAgJ2Rvd24nOidkb3duJyxcbiAgICAgICAgICAgICAgICAncHJlc3MnOidkb3duJyxcbiAgICAgICAgICAgICAgICAncmVsZWFzZSc6J3VwJyxcbiAgICAgICAgICAgICAgICAncmVsZWFzZXByZXNzJzonZG93bicsXG4gICAgICAgICAgICAgICAgJ3ByZXNzcmVsZWFzZSc6J3VwJyxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvcih2YXIga2V5IGluIHRoaXMuc3RhdHVzKXtcbiAgICAgICAgICAgICAgICBpZih0aGlzLnN0YXR1cy5oYXNPd25Qcm9wZXJ0eShrZXkpKXtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0dXNba2V5XSA9IHRyYW5zaXRpb25bdGhpcy5zdGF0dXNba2V5XSB8fCAndXAnXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB1cHRyYW5zaXRpb24gPSB7XG4gICAgICAgICAgICAgICAgJ3VwJyA6ICAgJ3VwJyxcbiAgICAgICAgICAgICAgICAnZG93bicgOiAncmVsZWFzZScsXG4gICAgICAgICAgICAgICAgJ3ByZXNzJzogJ3ByZXNzcmVsZWFzZScsXG4gICAgICAgICAgICAgICAgJ3JlbGVhc2UnOidyZWxlYXNlJyxcbiAgICAgICAgICAgICAgICAncmVsZWFzZXByZXNzJzoncHJlc3NyZWxlYXNlJyxcbiAgICAgICAgICAgICAgICAncHJlc3NyZWxlYXNlJzoncHJlc3NyZWxlYXNlJyxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBkb3dudHJhbnNpdGlvbiA9IHtcbiAgICAgICAgICAgICAgICAndXAnOiAgICAncHJlc3MnLFxuICAgICAgICAgICAgICAgICdkb3duJzogICdkb3duJyxcbiAgICAgICAgICAgICAgICAncHJlc3MnOiAncHJlc3MnLFxuICAgICAgICAgICAgICAgICdyZWxlYXNlJzoncmVsZWFzZXByZXNzJyxcbiAgICAgICAgICAgICAgICAncmVsZWFzZXByZXNzJzoncmVsZWFzZXByZXNzJyxcbiAgICAgICAgICAgICAgICAncHJlc3NyZWxlYXNlJzoncmVsZWFzZXByZXNzJyxcbiAgICAgICAgICAgIH07XG5cblxuICAgICAgICAgICAgZm9yKHZhciBpID0gMCwgbGVuID0gdGhpcy5ldmVudHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBlID0gdGhpcy5ldmVudHNbaV07XG4gICAgICAgICAgICAgICAgaWYoZS50eXBlID09PSAndXAnKXtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0dXNbZS5rZXldID0gdXB0cmFuc2l0aW9uW3RoaXMuc3RhdHVzW2Uua2V5XSB8fCAndXAnXTtcbiAgICAgICAgICAgICAgICB9ZWxzZXsgXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzW2Uua2V5XSA9IGRvd250cmFuc2l0aW9uW3RoaXMuc3RhdHVzW2Uua2V5XSB8fCAndXAnXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZXZlbnRzID0gW107XG5cbiAgICAgICAgICAgIHRoaXMuZGVsdGFQb3MgPSB0aGlzLm5ld1Bvcy5zdWIodGhpcy5wb3MpO1xuICAgICAgICAgICAgdGhpcy5wb3MgPSB0aGlzLm5ld1BvcztcblxuICAgICAgICB9LFxuICAgICAgICBwcmVzc2VkOiBmdW5jdGlvbihrZXkpe1xuICAgICAgICAgICAgdmFyIHN0YXR1cyA9IHRoaXMuc3RhdHVzW2tleV0gfHwgJ3VwJztcbiAgICAgICAgICAgIHJldHVybiBzdGF0dXMgPT09ICdwcmVzcycgfHwgc3RhdHVzID09PSAncHJlc3NyZWxlYXNlJyB8fCBzdGF0dXMgPT09ICdyZWxlYXNlcHJlc3MnO1xuICAgICAgICAgfSxcbiAgICAgICAgZG93bjogZnVuY3Rpb24oa2V5KXtcbiAgICAgICAgICAgIHZhciBzdGF0dXMgPSB0aGlzLnN0YXR1c1trZXldIHx8ICd1cCc7XG4gICAgICAgICAgICByZXR1cm4gc3RhdHVzID09PSAnZG93bicgfHwgc3RhdHVzID09PSAncHJlc3MnIHx8IHN0YXR1cyA9PT0gJ3ByZXNzcmVsZWFzZSc7XG4gICAgICAgIH0sXG4gICAgICAgIHJlbGVhc2VkOiBmdW5jdGlvbihrZXkpe1xuICAgICAgICAgICAgdmFyIHN0YXR1cyA9IHRoaXMuc3RhdHVzW2tleV0gfHwgJ3VwJztcbiAgICAgICAgICAgIHJldHVybiBzdGF0dXMgPT09ICdyZWxlYXNlJyB8fCBzdGF0dXMgPT09ICdwcmVzc3JlbGVhc2UnIHx8IHN0YXR1cyA9PT0gJ3JlbGVhc2VwcmVzcyc7XG4gICAgICAgIH0sXG4gICAgICAgIHVwOiBmdW5jdGlvbihrZXkpe1xuICAgICAgICAgICAgdmFyIHN0YXR1cyA9IHRoaXMuc3RhdHVzW2tleV0gfHwgJ3VwJztcbiAgICAgICAgICAgIHJldHVybiBzdGF0dXMgPT09ICd1cCcgfHwgc3RhdHVzID09PSAncmVsZWFzZScgfHwgc3RhdHVzID09PSAncmVsZWFzZXByZXNzJztcbiAgICAgICAgfSxcbiAgICB9O1xuXG4gICAgbW9kdWxhLklucHV0ID0gSW5wdXQ7XG59KSh0eXBlb2YgZXhwb3J0cyA9PT0gJ3VuZGVmaW5lZCcgPyAoIHRoaXMubW9kdWxhIHx8ICh0aGlzLm1vZHVsYSA9IHt9KSkgOiBleHBvcnRzICk7XG5cbiIsIlxuLyogLS0tLS0tIDN4MyBNYXRyaXggZm9yIDJEIFRyYW5zZm9ybWF0aW9ucyAtLS0tLSAqL1xuXG4oZnVuY3Rpb24obW9kdWxhKXtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBWMiA9IG1vZHVsYS5WMiB8fCAodHlwZW9mICdyZXF1aXJlJyAhPT0gJ3VuZGVmaW5lZCcgPyByZXF1aXJlKCcuL1YyLmpzJykuVjIgOiBudWxsKTtcblxuICAgIGlmKCFWMiApe1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21vZHVsYS5NYXQzIHJlcXVpcmVzIG1vZHVsYS5WMicpO1xuICAgIH1cblxuICAgICAgICBcbiAgICAvLyAwIDMgNiB8IHh4IHh5IHh6XG4gICAgLy8gMSA0IDcgfCB5eCB5eSB5elxuICAgIC8vIDIgNSA4IHwgenggenkgenpcbiAgICBcbiAgICB2YXIgc2V0QXJyYXkgPSBmdW5jdGlvbihtZCxhcnJheSxvZmZzZXQpe1xuICAgICAgICBvZmZzZXQgPSBvZmZzZXQgfHwgMDtcbiAgICAgICAgbWQueHggPSBhcnJheVtvZmZzZXRdO1xuICAgICAgICBtZC54eSA9IGFycmF5W29mZnNldCArIDNdO1xuICAgICAgICBtZC54eiA9IGFycmF5W29mZnNldCArIDZdO1xuICAgICAgICBtZC55eCA9IGFycmF5W29mZnNldCArIDFdO1xuICAgICAgICBtZC55eSA9IGFycmF5W29mZnNldCArIDRdO1xuICAgICAgICBtZC55eiA9IGFycmF5W29mZnNldCArIDddO1xuICAgICAgICBtZC56eCA9IGFycmF5W29mZnNldCArIDJdO1xuICAgICAgICBtZC56eSA9IGFycmF5W29mZnNldCArIDVdO1xuICAgICAgICBtZC56eiA9IGFycmF5W29mZnNldCArIDhdO1xuICAgICAgICByZXR1cm4gbWQ7XG4gICAgfTtcblxuICAgIHZhciBzZXQgPSBmdW5jdGlvbihtZCAvKiwgY29tcG9uZW50cyAuLi4gKi8pe1xuICAgICAgICBzZXRBcnJheShtZCxhcmd1bWVudHMsMSk7XG4gICAgICAgIHJldHVybiBtZDtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gTWF0Mygpe1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmKHRoaXMuY29uc3RydWN0b3IgIT09IE1hdDMpe1xuICAgICAgICAgICAgc2VsZiA9IG5ldyBNYXQzKCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGFsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBpZihhbGVuID09PSAwKXtcbiAgICAgICAgICAgIHNlbGYueHggPSAxO1xuICAgICAgICAgICAgc2VsZi54eSA9IDA7XG4gICAgICAgICAgICBzZWxmLnh6ID0gMDtcbiAgICAgICAgICAgIHNlbGYueXggPSAwO1xuICAgICAgICAgICAgc2VsZi55eSA9IDE7XG4gICAgICAgICAgICBzZWxmLnl6ID0gMDtcbiAgICAgICAgICAgIHNlbGYuenggPSAwO1xuICAgICAgICAgICAgc2VsZi56eSA9IDA7XG4gICAgICAgICAgICBzZWxmLnp6ID0gMTtcbiAgICAgICAgfWVsc2UgaWYgKGFsZW4gPT09IDEpe1xuICAgICAgICAgICAgdmFyIGFyZyA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgICAgIGlmKGFyZ1swXSAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgICAgICBzZXRBcnJheShzZWxmLGFyZyk7XG4gICAgICAgICAgICB9ZWxzZSBpZiggdHlwZW9mIGFyZy5yb3RhdGUgPT09ICdudW1iZXInIHx8IFxuICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBhcmcuc2NhbGUgPT09ICdudW1iZXInICB8fCBcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgYXJnLnRyYW5zbGF0ZSA9PT0gJ251bWJlcicgKXtcbiAgICAgICAgICAgICAgICBNYXQzLnNldFRyYW5zZm9ybShzZWxmLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnLnRyYW5zbGF0ZSB8fCBuZXcgVjIoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZy5zY2FsZXx8IG5ldyBWMigxLDEpLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnLnJvdGF0ZSB8fCAwXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIHNlbGYueHggPSBhcmcueHggfHwgMDtcbiAgICAgICAgICAgICAgICBzZWxmLnh5ID0gYXJnLnh5IHx8IDA7XG4gICAgICAgICAgICAgICAgc2VsZi54eiA9IGFyZy54eiB8fCAwO1xuICAgICAgICAgICAgICAgIHNlbGYueXggPSBhcmcueXggfHwgMDtcbiAgICAgICAgICAgICAgICBzZWxmLnl5ID0gYXJnLnl5IHx8IDA7XG4gICAgICAgICAgICAgICAgc2VsZi55eiA9IGFyZy55eiB8fCAwO1xuICAgICAgICAgICAgICAgIHNlbGYuenggPSBhcmcuenggfHwgMDtcbiAgICAgICAgICAgICAgICBzZWxmLnp5ID0gYXJnLnp5IHx8IDA7XG4gICAgICAgICAgICAgICAgc2VsZi56eiA9IGFyZy56eiB8fCAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9ZWxzZSBpZiAoYWxlbiA9PT0gOSl7XG4gICAgICAgICAgICBzZXRBcnJheShzZWxmLGFyZ3VtZW50cyk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd3cm9uZyBudW1iZXIgb2YgYXJndW1lbnRzOicrYWxlbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfVxuXG4gICAgbW9kdWxhLk1hdDMgPSBNYXQzO1xuXG4gICAgTWF0My5pZCAgICAgICA9IG5ldyBNYXQzKCk7XG4gICAgTWF0My56ZXJvICAgICA9IG5ldyBNYXQzKDAsMCwwLDAsMCwwLDAsMCwwKTtcblxuICAgIHZhciB0bXAgPSBuZXcgTWF0MygpO1xuXG4gICAgdmFyIHByb3RvID0gTWF0My5wcm90b3R5cGU7XG5cbiAgICB2YXIgZXBzaWxvbiA9IDAuMDAwMDAwMDE7XG5cbiAgICBmdW5jdGlvbiBlcHNpbG9uRXF1YWxzKGEsYil7ICByZXR1cm4gTWF0aC5hYnMoYS1iKSA8PSBlcHNpbG9uOyB9XG5cbiAgICBNYXQzLmVxdWFscyAgPSBmdW5jdGlvbihtLG4pe1xuICAgICAgICByZXR1cm4gZXBzaWxvbkVxdWFscyhtLnh4LCBuLnh4KSAmJlxuICAgICAgICAgICAgICAgZXBzaWxvbkVxdWFscyhtLnh5LCBuLnh5KSAmJlxuICAgICAgICAgICAgICAgZXBzaWxvbkVxdWFscyhtLnh6LCBuLnh6KSAmJlxuICAgICAgICAgICAgICAgZXBzaWxvbkVxdWFscyhtLnl4LCBuLnl4KSAmJlxuICAgICAgICAgICAgICAgZXBzaWxvbkVxdWFscyhtLnl5LCBuLnl5KSAmJlxuICAgICAgICAgICAgICAgZXBzaWxvbkVxdWFscyhtLnl6LCBuLnl6KSAmJlxuICAgICAgICAgICAgICAgZXBzaWxvbkVxdWFscyhtLnp4LCBuLnp4KSAmJlxuICAgICAgICAgICAgICAgZXBzaWxvbkVxdWFscyhtLnp5LCBuLnp5KSAmJlxuICAgICAgICAgICAgICAgZXBzaWxvbkVxdWFscyhtLnp6LCBuLnp6KTtcbiAgICB9O1xuICAgICAgICBcbiAgICBwcm90by5lcXVhbHMgPSBmdW5jdGlvbihtYXQpe1xuICAgICAgICByZXR1cm4gTWF0My5lcXVhbHModGhpcyxtYXQpO1xuICAgIH07XG5cbiAgICBNYXQzLmNvcHkgPSBmdW5jdGlvbihtZCxtKXtcbiAgICAgICAgbWQueHggPSBtLnh4O1xuICAgICAgICBtZC54eSA9IG0ueHk7XG4gICAgICAgIG1kLnh6ID0gbS54ejtcbiAgICAgICAgbWQueXggPSBtLnl4O1xuICAgICAgICBtZC55eSA9IG0ueXk7XG4gICAgICAgIG1kLnl6ID0gbS55ejtcbiAgICAgICAgbWQuenggPSBtLnp4O1xuICAgICAgICBtZC56eSA9IG0uenk7XG4gICAgICAgIG1kLnp6ID0gbS56ejtcbiAgICAgICAgcmV0dXJuIG1kO1xuICAgIH07XG5cbiAgICBNYXQzLnNldCA9IHNldDtcblxuICAgIE1hdDMuc2V0QXJyYXkgPSBzZXRBcnJheTtcblxuICAgIE1hdDMuc2V0SWQgPSBmdW5jdGlvbihtZCl7XG4gICAgICAgIG1kLnh4ID0gMTtcbiAgICAgICAgbWQueHkgPSAwO1xuICAgICAgICBtZC54eiA9IDA7XG4gICAgICAgIG1kLnl4ID0gMDtcbiAgICAgICAgbWQueXkgPSAxO1xuICAgICAgICBtZC55eiA9IDA7XG4gICAgICAgIG1kLnp4ID0gMDtcbiAgICAgICAgbWQuenkgPSAwO1xuICAgICAgICBtZC56eiA9IDE7XG4gICAgICAgIHJldHVybiBtZDtcbiAgICB9O1xuXG4gICAgTWF0My5zZXRaZXJvID0gZnVuY3Rpb24obWQpe1xuICAgICAgICBNYXQzLmNvcHkobWQsTWF0My56ZXJvKTtcbiAgICAgICAgcmV0dXJuIG1kO1xuICAgIH07XG5cbiAgICBwcm90by5jbG9uZSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBtID0gbmV3IE1hdDMoKTtcbiAgICAgICAgTWF0My5jb3B5KG0sdGhpcyk7XG4gICAgICAgIHJldHVybiBtO1xuICAgIH07XG5cbiAgICBwcm90by50b1N0cmluZyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBzdHIgPSBcIltcIjtcbiAgICAgICAgc3RyICs9IHRoaXMueHggKyBcIixcIjtcbiAgICAgICAgc3RyICs9IHRoaXMueHkgKyBcIixcIjtcbiAgICAgICAgc3RyICs9IHRoaXMueHogKyBcIixcXG4gIFwiO1xuICAgICAgICBzdHIgKz0gdGhpcy55eCArIFwiLFwiO1xuICAgICAgICBzdHIgKz0gdGhpcy55eSArIFwiLFwiO1xuICAgICAgICBzdHIgKz0gdGhpcy55eiArIFwiLFxcbiAgXCI7XG4gICAgICAgIHN0ciArPSB0aGlzLnp4ICsgXCIsXCI7XG4gICAgICAgIHN0ciArPSB0aGlzLnp5ICsgXCIsXCI7XG4gICAgICAgIHN0ciArPSB0aGlzLnp6ICsgXCJdXCI7XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfTtcblxuICAgIE1hdDMuYWRkID0gZnVuY3Rpb24obWQsbSl7XG4gICAgICAgIG1kLnh4ICs9IG0ueHg7XG4gICAgICAgIG1kLnh5ICs9IG0ueHk7XG4gICAgICAgIG1kLnh6ICs9IG0ueHo7XG4gICAgICAgIG1kLnl4ICs9IG0ueXg7XG4gICAgICAgIG1kLnl5ICs9IG0ueXk7XG4gICAgICAgIG1kLnl6ICs9IG0ueXo7XG4gICAgICAgIG1kLnp4ICs9IG0ueng7XG4gICAgICAgIG1kLnp5ICs9IG0uenk7XG4gICAgICAgIG1kLnp6ICs9IG0ueno7XG4gICAgICAgIHJldHVybiBtZDtcbiAgICB9O1xuXG4gICAgcHJvdG8uYWRkID0gZnVuY3Rpb24obWF0KXtcbiAgICAgICAgdmFyIG1kID0gbmV3IE1hdDMoKTtcbiAgICAgICAgTWF0My5jb3B5KG1kLHRoaXMpO1xuICAgICAgICBNYXQzLmFkZChtZCxtYXQpO1xuICAgICAgICByZXR1cm4gbWQ7XG4gICAgfTtcblxuICAgIE1hdDMuc3ViID0gZnVuY3Rpb24obWQsbSl7XG4gICAgICAgIG1kLnh4IC09IG0ueHg7XG4gICAgICAgIG1kLnh5IC09IG0ueHk7XG4gICAgICAgIG1kLnh6IC09IG0ueHo7XG4gICAgICAgIG1kLnl4IC09IG0ueXg7XG4gICAgICAgIG1kLnl5IC09IG0ueXk7XG4gICAgICAgIG1kLnl6IC09IG0ueXo7XG4gICAgICAgIG1kLnp4IC09IG0ueng7XG4gICAgICAgIG1kLnp5IC09IG0uenk7XG4gICAgICAgIG1kLnp6IC09IG0ueno7XG4gICAgICAgIHJldHVybiBtZDtcbiAgICB9O1xuXG4gICAgcHJvdG8uc3ViID0gZnVuY3Rpb24obWF0KXtcbiAgICAgICAgdmFyIG1kID0gbmV3IE1hdDMoKTtcbiAgICAgICAgTWF0My5jb3B5KG1kLHRoaXMpO1xuICAgICAgICBNYXQzLnN1YihtZCxtYXQpO1xuICAgICAgICByZXR1cm4gbWQ7XG4gICAgfTtcblxuICAgIE1hdDMubmVnID0gZnVuY3Rpb24obWQpe1xuICAgICAgICBtZC54eCA9IC1tZC54eDtcbiAgICAgICAgbWQueHkgPSAtbWQueHk7XG4gICAgICAgIG1kLnh6ID0gLW1kLnh6O1xuICAgICAgICBtZC55eCA9IC1tZC55eDtcbiAgICAgICAgbWQueXkgPSAtbWQueXk7XG4gICAgICAgIG1kLnl6ID0gLW1kLnl6O1xuICAgICAgICBtZC56eCA9IC1tZC56eDtcbiAgICAgICAgbWQuenkgPSAtbWQuenk7XG4gICAgICAgIG1kLnp6ID0gLW1kLnp6O1xuICAgIH07XG5cbiAgICBwcm90by5uZWcgPSBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgbWQgPSBuZXcgTWF0MygpO1xuICAgICAgICBNYXQzLmNvcHkobWQsdGhpcyk7XG4gICAgICAgIE1hdDMubmVnKG1kKTtcbiAgICAgICAgcmV0dXJuIG1kO1xuICAgIH07XG5cbiAgICBNYXQzLnRyID0gZnVuY3Rpb24obWQpe1xuICAgICAgICBNYXQzLmNvcHkodG1wLG1kKTtcbiAgICAgICAgbWQueHggPSB0bXAueHg7XG4gICAgICAgIG1kLnh5ID0gdG1wLnl4O1xuICAgICAgICBtZC54eiA9IHRtcC56eDtcbiAgICAgICAgbWQueXggPSB0bXAueHk7XG4gICAgICAgIG1kLnl5ID0gdG1wLnl5O1xuICAgICAgICBtZC55eiA9IHRtcC56eTtcbiAgICAgICAgbWQuenggPSB0bXAueHo7XG4gICAgICAgIG1kLnp5ID0gdG1wLnl6O1xuICAgICAgICBtZC56eiA9IHRtcC56ejtcbiAgICAgICAgcmV0dXJuIG1kO1xuICAgIH07XG5cbiAgICBwcm90by50ciA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBtZCA9IG5ldyBNYXQzKCk7XG4gICAgICAgIE1hdDMuY29weShtZCx0aGlzKTtcbiAgICAgICAgTWF0My50cihtZCk7XG4gICAgICAgIHJldHVybiBtZDtcbiAgICB9O1xuXG4gICAgTWF0My5tdWx0ID0gZnVuY3Rpb24obWQsbSl7XG4gICAgICAgIHZhciBiID0gTWF0My5jb3B5KHRtcCxtZCk7XG4gICAgICAgIHZhciBhID0gbTtcbiAgICAgICAgaWYobWQgPT09IG0pe1xuICAgICAgICAgICAgYiA9IGE7XG4gICAgICAgIH1cbiAgICAgICAgbWQueHggPSBhLnh4KmIueHggKyBhLnh5KmIueXggKyBhLnh6KmIueng7IFxuICAgICAgICBtZC54eSA9IGEueHgqYi54eSArIGEueHkqYi55eSArIGEueHoqYi56eTsgXG4gICAgICAgIG1kLnh6ID0gYS54eCpiLnh6ICsgYS54eSpiLnl6ICsgYS54eipiLnp6OyBcblxuICAgICAgICBtZC55eCA9IGEueXgqYi54eCArIGEueXkqYi55eCArIGEueXoqYi56eDsgXG4gICAgICAgIG1kLnl5ID0gYS55eCpiLnh5ICsgYS55eSpiLnl5ICsgYS55eipiLnp5OyBcbiAgICAgICAgbWQueXogPSBhLnl4KmIueHogKyBhLnl5KmIueXogKyBhLnl6KmIueno7IFxuXG4gICAgICAgIG1kLnp4ID0gYS56eCpiLnh4ICsgYS56eSpiLnl4ICsgYS56eipiLnp4OyBcbiAgICAgICAgbWQuenkgPSBhLnp4KmIueHkgKyBhLnp5KmIueXkgKyBhLnp6KmIuenk7IFxuICAgICAgICBtZC56eiA9IGEuengqYi54eiArIGEuenkqYi55eiArIGEuenoqYi56ejsgXG4gICAgICAgIHJldHVybiBtZDtcbiAgICB9O1xuXG4gICAgTWF0My5tdWx0RmFjICA9IGZ1bmN0aW9uKG1kLGZhYyl7XG4gICAgICAgIG1kLnh4ICo9IGZhYztcbiAgICAgICAgbWQueHkgKj0gZmFjO1xuICAgICAgICBtZC54eiAqPSBmYWM7XG4gICAgICAgIG1kLnl4ICo9IGZhYztcbiAgICAgICAgbWQueXkgKj0gZmFjO1xuICAgICAgICBtZC55eiAqPSBmYWM7XG4gICAgICAgIG1kLnp4ICo9IGZhYztcbiAgICAgICAgbWQuenkgKj0gZmFjO1xuICAgICAgICBtZC56eiAqPSBmYWM7XG4gICAgICAgIHJldHVybiBtZDtcbiAgICB9O1xuXG4gICAgTWF0My5tdWx0VjIgPSBmdW5jdGlvbih2ZCxtKXtcbiAgICAgICAgdmFyIHZ4ID0gdmQueCwgdnkgPSB2ZC55O1xuICAgICAgICB2YXIgZCAgPSAxLjAgLyAoIHZ4ICogbS56eCArIHZ5ICogbS56eSArIG0uenopO1xuICAgICAgICB2ZC54ID0gZCAqICggbS54eCAqIHZ4ICsgbS54eSAqIHZ5ICsgbS54eiApO1xuICAgICAgICB2ZC55ID0gZCAqICggbS55eCAqIHZ4ICsgbS55eSAqIHZ5ICsgbS55eiApO1xuICAgICAgICByZXR1cm4gdmQ7XG4gICAgfTtcblxuICAgIHByb3RvLm11bHQgPSBmdW5jdGlvbihhcmcpe1xuICAgICAgICB2YXIgbWQsdmQ7XG4gICAgICAgIGlmKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKXtcbiAgICAgICAgICAgIG1kID0gbmV3IE1hdDMoKTtcbiAgICAgICAgICAgIE1hdDMuY29weShtZCx0aGlzKTtcbiAgICAgICAgICAgIE1hdDMubXVsdEZhYyhtZCxhcmcpO1xuICAgICAgICAgICAgcmV0dXJuIG1kO1xuICAgICAgICB9ZWxzZSBpZihhcmcgaW5zdGFuY2VvZiBNYXQzKXtcbiAgICAgICAgICAgIG1kID0gbmV3IE1hdDMoKTtcbiAgICAgICAgICAgIE1hdDMuY29weShtZCx0aGlzKTtcbiAgICAgICAgICAgIE1hdDMubXVsdChtZCxhcmcpO1xuICAgICAgICAgICAgcmV0dXJuIG1kO1xuICAgICAgICB9ZWxzZSBpZihhcmcgaW5zdGFuY2VvZiBWMil7XG4gICAgICAgICAgICB2ZCA9IG5ldyBWMigpO1xuICAgICAgICAgICAgVjIuY29weSh2ZCxhcmcpO1xuICAgICAgICAgICAgTWF0My5tdWx0VjIodmQsdGhpcyk7XG4gICAgICAgICAgICByZXR1cm4gdmQ7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNYXQzOiBtdWx0KCksIGNhbm5vdCBtdWx0aXBseSB3aXRoIGFuIG9iamVjdCBvZiB0aGlzIHR5cGU6Jyx0eXBlb2YgYXJnKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBNYXQzLnNldFJvdGF0ZSA9IGZ1bmN0aW9uKG1kLGFuZ2xlKXtcbiAgICAgICAgdmFyIGMgPSBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICAgIHZhciBzID0gTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgICBNYXQzLnNldElkKG1kKTtcbiAgICAgICAgbWQueHggPSBjO1xuICAgICAgICBtZC54eSA9IC1zO1xuICAgICAgICBtZC55eCA9IHM7XG4gICAgICAgIG1kLnl5ID0gYztcbiAgICAgICAgcmV0dXJuIG1kO1xuICAgIH07XG5cbiAgICBNYXQzLnJvdGF0ZSA9IGZ1bmN0aW9uKGFuZ2xlKXtcbiAgICAgICAgdmFyIG1kID0gbmV3IE1hdDMoKTtcbiAgICAgICAgTWF0My5zZXRSb3RhdGUobWQsYW5nbGUpO1xuICAgICAgICByZXR1cm4gbWQ7XG4gICAgfTtcblxuICAgIE1hdDMuc2V0U2tld1ggPSBmdW5jdGlvbihtZCxzaGVhcil7XG4gICAgICAgIE1hdDMuc2V0SWQobWQpO1xuICAgICAgICBtZC54eSA9IHNoZWFyO1xuICAgICAgICByZXR1cm4gbWQ7XG4gICAgfTtcbiAgICBcbiAgICBNYXQzLnNoZWFyWCA9IGZ1bmN0aW9uKHNoZWFyKXtcbiAgICAgICAgdmFyIG1kID0gbmV3IE1hdDMoKTtcbiAgICAgICAgbWQueHkgPSBzaGVhcjtcbiAgICAgICAgcmV0dXJuIG1kO1xuICAgIH07XG5cbiAgICBNYXQzLnNldFNrZXdZID0gZnVuY3Rpb24obWQsc2hlYXIpe1xuICAgICAgICBNYXQzLnNldElkKG1kKTtcbiAgICAgICAgbWQueXggPSBzaGVhcjtcbiAgICAgICAgcmV0dXJuIG1kO1xuICAgIH07XG4gICAgXG4gICAgTWF0My5zaGVhclkgPSBmdW5jdGlvbihzaGVhcil7XG4gICAgICAgIHZhciBtZCA9IG5ldyBNYXQzKCk7XG4gICAgICAgIG1kLnl4ID0gc2hlYXI7XG4gICAgICAgIHJldHVybiBtZDtcbiAgICB9O1xuXG4gICAgTWF0My5zZXRTY2FsZSA9IGZ1bmN0aW9uKG1kLHNjYWxlKXtcbiAgICAgICAgTWF0My5zZXRJZChtZCk7XG4gICAgICAgIG1kLnh4ID0gc2NhbGUueDtcbiAgICAgICAgbWQueXkgPSBzY2FsZS55O1xuICAgICAgICByZXR1cm4gbWQ7XG4gICAgfTtcblxuICAgIE1hdDMuc2NhbGUgICAgPSBmdW5jdGlvbihzdil7XG4gICAgICAgIHZhciBtZCA9IG5ldyBNYXQzKCk7XG4gICAgICAgIE1hdDMuc2V0U2NhbGUobWQsc3YpO1xuICAgICAgICByZXR1cm4gbWQ7XG4gICAgfTtcblxuICAgIE1hdDMuc2V0VHJhbnNsYXRlID0gZnVuY3Rpb24obWQsdmVjKXtcbiAgICAgICAgTWF0My5zZXRJZChtZCk7XG4gICAgICAgIG1kLnh6ID0gdmVjLng7XG4gICAgICAgIG1kLnl6ID0gdmVjLnk7XG4gICAgICAgIHJldHVybiBtZDtcbiAgICB9O1xuXG4gICAgTWF0My50cmFuc2xhdGUgPSBmdW5jdGlvbih2KXtcbiAgICAgICAgdmFyIG1kID0gbmV3IE1hdDMoKTtcbiAgICAgICAgTWF0My5zZXRUcmFuc2xhdGUobWQsdik7XG4gICAgICAgIHJldHVybiBtZDtcbiAgICB9O1xuXG4gICAgdmFyIHRtcF90ciA9IG5ldyBNYXQzKCk7XG4gICAgTWF0My5zZXRUcmFuc2Zvcm0gPSBmdW5jdGlvbihtZCxwb3Msc2NhbGUsYW5nbGUpe1xuICAgICAgICBNYXQzLnNldFNjYWxlKG1kLHNjYWxlKTsgLy9GSVhNRVxuICAgICAgICBNYXQzLnNldFJvdGF0ZSh0bXBfdHIsYW5nbGUpO1xuICAgICAgICBNYXQzLm11bHQobWQsdG1wX3RyKTtcbiAgICAgICAgTWF0My5zZXRUcmFuc2xhdGUodG1wX3RyLHBvcyk7XG4gICAgICAgIE1hdDMubXVsdChtZCx0bXBfdHIpO1xuICAgICAgICByZXR1cm4gbWQ7XG4gICAgfTtcblxuICAgIE1hdDMudHJhbnNmb3JtICAgPSBmdW5jdGlvbihwb3Msc2NhbGUsYW5nbGUpe1xuICAgICAgICB2YXIgbWQgPSBuZXcgTWF0MygpO1xuICAgICAgICBNYXQzLnNldFRyYW5zZm9ybShtZCxwb3Msc2NhbGUsYW5nbGUpO1xuICAgICAgICByZXR1cm4gbWQ7XG4gICAgfTtcblxuICAgIHByb3RvLmdldFNjYWxlID0gZnVuY3Rpb24oKXt9O1xuICAgIHByb3RvLmdldFJvdGF0ZSA9IGZ1bmN0aW9uKCl7fTtcbiAgICBwcm90by5nZXRUcmFuc2xhdGUgPSBmdW5jdGlvbigpe307XG5cbiAgICBNYXQzLmRldCA9IGZ1bmN0aW9uKG0pe1xuICAgICAgICByZXR1cm4gbS54eCoobS56eiptLnl5LW0uenkqbS55eikgLSBtLnl4KihtLnp6Km0ueHktbS56eSptLnh6KSArIG0uengqKG0ueXoqbS54eS1tLnl5Km0ueHopO1xuICAgIH07XG5cbiAgICBwcm90by5kZXQgPSBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4gTWF0My5kZXQodGhpcyk7XG4gICAgfTtcblxuICAgIE1hdDMuaW52ZXJ0ICA9IGZ1bmN0aW9uKG1kKXtcbiAgICAgICAgdmFyIGRldCA9IE1hdDMuZGV0KG1kKTtcbiAgICAgICAgdmFyIG0gPSBNYXQzLmNvcHkodG1wLG1kKTtcblxuICAgICAgICAvLyBodHRwOi8vd3d3LmRyLWxleC5iZS9yYW5kb20vbWF0cml4X2ludi5odG1sXG4gICAgICAgIC8vIHwgbS54eCBtLnh5IG0ueHogfCAgICAgICAgICAgICAgIHwgICBtLnp6IG0ueXktbS56eSBtLnl6ICAtKG0uenogbS54eS1tLnp5IG0ueHopICAgbS55eiBtLnh5LW0ueXkgbS54eiAgfFxuICAgICAgICAvLyB8IG0ueXggbS55eSBtLnl6IHwgICAgPSAgMS9ERVQgKiB8IC0obS56eiBtLnl4LW0uenggbS55eikgICBtLnp6IG0ueHgtbS56eCBtLnh6ICAtKG0ueXogbS54eC1tLnl4IG0ueHopIHxcbiAgICAgICAgLy8gfCBtLnp4IG0uenkgbS56eiB8ICAgICAgICAgICAgICAgfCAgIG0uenkgbS55eC1tLnp4IG0ueXkgIC0obS56eSBtLnh4LW0uenggbS54eSkgICBtLnl5IG0ueHgtbS55eCBtLnh5ICB8XG4gICAgICAgIFxuICAgICAgICBkZXQgPSAxIC8gZGV0O1xuXG4gICAgICAgIG1kLnh4ID0gIGRldCooIG0uenoqbS55eS1tLnp5Km0ueXogKTtcbiAgICAgICAgbWQueHkgPSAtZGV0KiggbS56eiptLnh5LW0uenkqbS54eiApO1xuICAgICAgICBtZC54eiA9ICBkZXQqKCBtLnl6Km0ueHktbS55eSptLnh6ICk7XG4gICAgICAgIFxuICAgICAgICBtZC55eCA9IC1kZXQqKCBtLnp6Km0ueXgtbS56eCptLnl6ICk7XG4gICAgICAgIG1kLnl5ID0gIGRldCooIG0uenoqbS54eC1tLnp4Km0ueHogKTtcbiAgICAgICAgbWQueXogPSAtZGV0KiggbS55eiptLnh4LW0ueXgqbS54eiApO1xuXG4gICAgICAgIG1kLnp4ID0gIGRldCooIG0uenkqbS55eC1tLnp4Km0ueXkgKTtcbiAgICAgICAgbWQuenkgPSAtZGV0KiggbS56eSptLnh4LW0uengqbS54eSApO1xuICAgICAgICBtZC56eiA9ICBkZXQqKCBtLnl5Km0ueHgtbS55eCptLnh5ICk7XG4gICAgICAgIHJldHVybiBtZDtcbiAgICB9O1xuXG4gICAgcHJvdG8uaW52ZXJ0ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIG1kID0gbmV3IE1hdDMoKTtcbiAgICAgICAgTWF0My5jb3B5KG1kLHRoaXMpO1xuICAgICAgICBNYXQzLmludmVydChtZCk7XG4gICAgICAgIHJldHVybiBtZDtcbiAgICB9O1xuXG4gICAgdmFyIG1hcCA9IFsgWyd4eCcsJ3h5JywneHonXSxcbiAgICAgICAgICAgICAgICBbJ3l4JywneXknLCd5eiddLFxuICAgICAgICAgICAgICAgIFsnengnLCd6eScsJ3p6J10gXTtcbiAgICBcbiAgICBwcm90by5paiA9IGZ1bmN0aW9uKGksail7XG4gICAgICAgIHJldHVybiB0aGlzWyBtYXBbaV1bal0gXTtcbiAgICB9O1xuXG4gICAgTWF0My50b0FycmF5ID0gZnVuY3Rpb24oYXJyYXksbSxvZmZzZXQpe1xuICAgICAgICBvZmZzZXQgPSBvZmZzZXQgfHwgMDtcbiAgICAgICAgLy8gMCAzIDYgfCB4eCB4eSB4elxuICAgICAgICAvLyAxIDQgNyB8IHl4IHl5IHl6XG4gICAgICAgIC8vIDIgNSA4IHwgenggenkgenpcbiAgICAgICAgYXJyYXlbMCtvZmZzZXRdID0gbS54eDtcbiAgICAgICAgYXJyYXlbMStvZmZzZXRdID0gbS55eDtcbiAgICAgICAgYXJyYXlbMitvZmZzZXRdID0gbS56eDtcbiAgICAgICAgYXJyYXlbMytvZmZzZXRdID0gbS54eTtcbiAgICAgICAgYXJyYXlbNCtvZmZzZXRdID0gbS55eTtcbiAgICAgICAgYXJyYXlbNStvZmZzZXRdID0gbS56eTtcbiAgICAgICAgYXJyYXlbNitvZmZzZXRdID0gbS54ejtcbiAgICAgICAgYXJyYXlbNytvZmZzZXRdID0gbS55ejtcbiAgICAgICAgYXJyYXlbOCtvZmZzZXRdID0gbS56ejtcbiAgICB9O1xuXG4gICAgcHJvdG8uYXJyYXkgPSBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgYXJyYXkgPSBbXTtcbiAgICAgICAgTWF0My50b0FycmF5KGFycmF5LHRoaXMpO1xuICAgICAgICByZXR1cm4gYXJyYXk7XG4gICAgfTtcblxuICAgIHByb3RvLmZsb2F0MzIgPSBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgYXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KDkpO1xuICAgICAgICBNYXQzLnRvQXJyYXkoYXJyYXksdGhpcyk7XG4gICAgICAgIHJldHVybiBhcnJheTtcbiAgICB9O1xuXG59KSh0eXBlb2YgZXhwb3J0cyA9PT0gJ3VuZGVmaW5lZCcgPyAoIHRoaXMubW9kdWxhIHx8ICh0aGlzLm1vZHVsYSA9IHt9KSkgOiBleHBvcnRzICk7XG5cbiIsIlxuLyogLS0tLS0gMkQgQm91bmRpbmcgUmVjdGFuZ2xlIC0tLS0tICovXG5cbihmdW5jdGlvbihtb2R1bGEpe1xuXG4gICAgdmFyIFYyID0gbW9kdWxhLlYyIHx8IHR5cGVvZiAncmVxdWlyZScgIT09ICd1bmRlZmluZWQnID8gcmVxdWlyZSgnLi9WMi5qcycpLlYyIDogbnVsbDtcblxuICAgIGlmKCFWMiApe1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21vZHVsYS5SZWN0IHJlcXVpcmVzIG1vZHVsYS5WMicpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIFJlY3QoeCx5LHN4LHN5LGNlbnRlcmVkKXtcbiAgICAgICAgdGhpcy5zeCA9IHN4OyAgICAgICAgICAgLy8gd2lkdGggb2YgdGhlIHJlY3RhbmdsZSBvbiB0aGUgeCBheGlzXG4gICAgICAgIHRoaXMuc3kgPSBzeTsgICAgICAgICAgIC8vIHdpZHRoIG9mIHRoZSByZWN0YW5nbGUgb24gdGhlIHkgYXhpc1xuICAgICAgICB0aGlzLmh4ID0gc3gvMjsgICAgICAgICAvLyBoYWxmIG9mIHRoZSByZWN0YW5nbGUgd2lkdGggb24gdGhlIHggYXhpc1xuICAgICAgICB0aGlzLmh5ID0gc3kvMjsgICAgICAgICAvLyBoYWxmIG9mIHRoZSByZWN0YW5nbGUgd2lkdGggb24gdGhlIHkgYXhpc1xuICAgICAgICB0aGlzLnggID0geDsgICAgICAgICAgICAvLyBtaW5pbXVtIHggY29vcmRpbmF0ZSBjb250YWluZWQgaW4gdGhlIHJlY3RhbmdsZSAgXG4gICAgICAgIHRoaXMueSAgPSB5OyAgICAgICAgICAgIC8vIG1pbmltdW0geSBjb29yZGluYXRlIGNvbnRhaW5lZCBpbiB0aGUgcmVjdGFuZ2xlXG4gICAgICAgIHRoaXMuY3ggPSB4ICsgdGhpcy5oeDsgICAvLyB4IGNvb3JkaW5hdGUgb2YgdGhlIHJlY3RhbmdsZSBjZW50ZXJcbiAgICAgICAgdGhpcy5jeSA9IHkgKyB0aGlzLmh5OyAgIC8vIHkgY29vcmRpbmF0ZSBvZiB0aGUgcmVjdGFuZ2xlIGNlbnRlclxuICAgICAgICB0aGlzLm14ID0gdGhpcy54ICsgc3g7ICAgLy8gbWF4aW11bSB4IGNvb3JkaW5hdGUgY29udGFpbmVkIGluIHRoZSByZWN0YW5nbGVcbiAgICAgICAgdGhpcy5teSA9IHRoaXMueSArIHN5OyAgIC8vIG1heGltdW0geCBjb29yZGluYXRlIGNvbnRhaW5lZCBpbiB0aGUgcmVjdGFuZ2xlXG4gICAgICAgIGlmKGNlbnRlcmVkKXtcbiAgICAgICAgICAgIHRoaXMueCAtPSB0aGlzLmh4O1xuICAgICAgICAgICAgdGhpcy5jeCAtPSB0aGlzLmh4O1xuICAgICAgICAgICAgdGhpcy5teCAtPSB0aGlzLmh4O1xuICAgICAgICAgICAgdGhpcy55IC09IHRoaXMuaHk7XG4gICAgICAgICAgICB0aGlzLmN5IC09IHRoaXMuaHk7XG4gICAgICAgICAgICB0aGlzLm15IC09IHRoaXMuaHk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBtb2R1bGEuUmVjdCA9IFJlY3Q7XG5cbiAgICBSZWN0LnByb3RvdHlwZS5faXNCb3VuZCA9IHRydWU7XG4gICAgUmVjdC5wcm90b3R5cGUubWluID0gZnVuY3Rpb24oKXsgIHJldHVybiBuZXcgVjIodGhpcy54LCB0aGlzLnkpOyB9O1xuICAgIFJlY3QucHJvdG90eXBlLm1pblggPSBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy54OyB9O1xuICAgIFJlY3QucHJvdG90eXBlLm1pblkgPSBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy55OyB9O1xuICAgIFJlY3QucHJvdG90eXBlLm1heCA9IGZ1bmN0aW9uKCl7ICByZXR1cm4gbmV3IFYyKHRoaXMubXgsIHRoaXMubXkpOyB9O1xuICAgIFJlY3QucHJvdG90eXBlLm1heFggPSBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy5teDsgfTtcbiAgICBSZWN0LnByb3RvdHlwZS5tYXhZID0gZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMubXk7IH07XG4gICAgUmVjdC5wcm90b3R5cGUuc2l6ZSA9IGZ1bmN0aW9uKCl7IHJldHVybiBuZXcgVjIodGhpcy5zeCwgdGhpcy5zeSk7IH07XG4gICAgUmVjdC5wcm90b3R5cGUuY2VudGVyID0gZnVuY3Rpb24oKXtyZXR1cm4gbmV3IFYyKHRoaXMuY3gsIHRoaXMuY3kpOyB9O1xuICAgIFJlY3QucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uKGIpeyByZXR1cm4gKCB0aGlzLmN4ID09PSBiLmN4ICYmIHRoaXMuY3kgPT09IGIuY3kgJiYgdGhpcy5zeCA9PT0gYi5zeCAmJiB0aGlzLnN5ID09PSBiLnN5KTsgfTtcbiAgICBSZWN0LnByb3RvdHlwZS5jbG9uZSAgPSBmdW5jdGlvbigpeyAgcmV0dXJuIG5ldyBSZWN0KHRoaXMueCx0aGlzLnksdGhpcy5zeCwgdGhpcy5zeSk7IH07XG4gICAgUmVjdC5wcm90b3R5cGUuY2xvbmVBdCA9IGZ1bmN0aW9uKGNlbnRlcil7IHJldHVybiBuZXcgUmVjdChjZW50ZXIueCAtIHRoaXMuaHgsIGNlbnRlci55IC10aGlzLmh5LCB0aGlzLnN4LCB0aGlzLnN5KTsgfTtcblxuICAgIC8vaW50ZXJzZWN0IGxpbmUgYSxiIHdpdGggbGluZSBjLGQsIHJldHVybnMgbnVsbCBpZiBubyBpbnRlcnNlY3Rpb25cbiAgICBmdW5jdGlvbiBsaW5lSW50ZXJzZWN0KGEsYixjLGQpe1xuICAgICAgICAvLyBodHRwOi8vcGF1bGJvdXJrZS5uZXQvZ2VvbWV0cnkvbGluZWxpbmUyZC9cbiAgICAgICAgdmFyIGYgPSAoKGQueSAtIGMueSkqKGIueCAtIGEueCkgLSAoZC54IC0gYy54KSooYi55IC0gYS55KSk7IFxuICAgICAgICBpZihmID09PSAwKXtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGYgPSAxIC8gZjtcbiAgICAgICAgdmFyIGZhYiA9ICgoZC54IC0gYy54KSooYS55IC0gYy55KSAtIChkLnkgLSBjLnkpKihhLnggLSBjLngpKSAqIGYgO1xuICAgICAgICBpZihmYWIgPCAwIHx8IGZhYiA+IDEpe1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGZjZCA9ICgoYi54IC0gYS54KSooYS55IC0gYy55KSAtIChiLnkgLSBhLnkpKihhLnggLSBjLngpKSAqIGYgO1xuICAgICAgICBpZihmY2QgPCAwIHx8IGZjZCA+IDEpe1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBWMihhLnggKyBmYWIgKiAoYi54LWEueCksIGEueSArIGZhYiAqIChiLnkgLSBhLnkpICk7XG4gICAgfVxuXG4gICAgLy8gcmV0dXJucyBhbiB1bm9yZGVyZWQgbGlzdCBvZiB2ZWN0b3IgZGVmaW5pbmcgdGhlIHBvc2l0aW9ucyBvZiB0aGUgaW50ZXJzZWN0aW9ucyBiZXR3ZWVuIHRoZSBlbGxpcHNlJ3NcbiAgICAvLyBib3VuZGFyeSBhbmQgYSBsaW5lIHNlZ21lbnQgZGVmaW5lZCBieSB0aGUgc3RhcnQgYW5kIGVuZCB2ZWN0b3JzIGEsYlxuXG4gICAgUmVjdC5wcm90b3R5cGUuY29sbGlkZVNlZ21lbnQgPSBmdW5jdGlvbihhLGIpe1xuICAgICAgICB2YXIgY29sbGlzaW9ucyA9IFtdO1xuICAgICAgICB2YXIgY29ybmVycyA9IFsgbmV3IFYyKHRoaXMueCx0aGlzLnkpLCBuZXcgVjIodGhpcy54LHRoaXMubXkpLCBcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBWMih0aGlzLm14LHRoaXMubXkpLCBuZXcgVjIodGhpcy5teCx0aGlzLnkpIF07XG4gICAgICAgIHZhciBwb3MgPSBsaW5lSW50ZXJzZWN0KGEsYixjb3JuZXJzWzBdLGNvcm5lcnNbMV0pO1xuICAgICAgICBpZihwb3MpIGNvbGxpc2lvbnMucHVzaChwb3MpO1xuICAgICAgICBwb3MgPSBsaW5lSW50ZXJzZWN0KGEsYixjb3JuZXJzWzFdLGNvcm5lcnNbMl0pO1xuICAgICAgICBpZihwb3MpIGNvbGxpc2lvbnMucHVzaChwb3MpO1xuICAgICAgICBwb3MgPSBsaW5lSW50ZXJzZWN0KGEsYixjb3JuZXJzWzJdLGNvcm5lcnNbM10pO1xuICAgICAgICBpZihwb3MpIGNvbGxpc2lvbnMucHVzaChwb3MpO1xuICAgICAgICBwb3MgPSBsaW5lSW50ZXJzZWN0KGEsYixjb3JuZXJzWzNdLGNvcm5lcnNbMF0pO1xuICAgICAgICBpZihwb3MpIGNvbGxpc2lvbnMucHVzaChwb3MpO1xuICAgICAgICByZXR1cm4gY29sbGlzaW9ucztcbiAgICB9O1xuICAgIFJlY3QucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24oYXJnKXtcbiAgICAgICAgaWYoYXJnIGluc3RhbmNlb2YgVjIpe1xuICAgICAgICAgICAgcmV0dXJuICggYXJnLnggPj0gdGhpcy54ICYmIGFyZy54IDw9IHRoaXMubXggJiZcbiAgICAgICAgICAgICAgICAgICAgIGFyZy55ID49IHRoaXMueSAmJiBhcmcueSA8PSB0aGlzLm15ICk7XG4gICAgICAgIH1lbHNlIGlmKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbnMobmV3IFYyKGFyZ3VtZW50c1swXSxhcmd1bWVudHNbMV0pKTtcbiAgICAgICAgfWVsc2UgaWYoIGFyZyBpbnN0YW5jZW9mIFJlY3Qpe1xuICAgICAgICAgICAgcmV0dXJuIChhcmcueCA+PSB0aGlzLnggJiYgYXJnLm14IDw9IHRoaXMubXggJiZcbiAgICAgICAgICAgICAgICAgICAgYXJnLnkgPj0gdGhpcy55ICYmIGFyZy5teSA8PSB0aGlzLm15ICk7XG4gICAgICAgIH1lbHNlIGlmKGFyZy5faXNCb3VuZCl7XG4gICAgICAgICAgICByZXR1cm4gKGFyZy5taW5YKCkgPj0gdGhpcy54ICYmIGFyZy5tYXhYKCkgPD0gdGhpcy5teCAmJlxuICAgICAgICAgICAgICAgICAgICBhcmcubWluWSgpID49IHRoaXMueSAmJiBhcmcubWF4WSgpIDw9IHRoaXMubXkgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGJvdW5kQ29sbGlkZXMoYW1pbiwgYW1heCwgYm1pbiwgYm1heCl7XG4gICAgICAgIGlmKGFtaW4gKyBhbWF4IDwgYm1pbiArIGJtYXgpe1xuICAgICAgICAgICAgcmV0dXJuIGFtYXggPiBibWluO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHJldHVybiBhbWluIDwgYm1heDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiBib3VuZEVzY2FwZURpc3QoYW1pbiwgYW1heCwgYm1pbiwgYm1heCl7XG4gICAgICAgIHZhciBkaXNwO1xuICAgICAgICBpZihhbWluICsgYW1heCA8IGJtaW4gKyBibWF4KXtcbiAgICAgICAgICAgIGRpc3AgPSBibWluIC0gYW1heDtcbiAgICAgICAgICAgIGlmKGRpc3AgPj0gMCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGlzcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBkaXNwID0gYm1heCAtIGFtaW47XG4gICAgICAgICAgICBpZihkaXNwIDw9IDApe1xuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpc3A7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBSZWN0LnByb3RvdHlwZS5jb2xsaWRlcyA9IGZ1bmN0aW9uKGIpe1xuICAgICAgICByZXR1cm4gYm91bmRDb2xsaWRlcyh0aGlzLngsIHRoaXMubXgsIGIueCwgYi5teCkgJiYgXG4gICAgICAgICAgICAgICBib3VuZENvbGxpZGVzKHRoaXMueSwgdGhpcy5teSwgYi55LCBiLm15KTtcbiAgICB9O1xuICAgIFxuICAgIFJlY3QucHJvdG90eXBlLmNvbGxpc2lvbkF4aXMgPSBmdW5jdGlvbihiKXtcbiAgICAgICAgdmFyIGR4ID0gYm91bmRFc2NhcGVEaXN0KHRoaXMueCwgdGhpcy5teCwgYi54LCBiLm14KTsgXG4gICAgICAgIHZhciBkeSA9IGJvdW5kRXNjYXBlRGlzdCh0aGlzLnksIHRoaXMubXksIGIueSwgYi5teSk7XG4gICAgICAgIGlmKCBNYXRoLmFicyhkeCkgPCBNYXRoLmFicyhkeSkgKXtcbiAgICAgICAgICAgIHJldHVybiBuZXcgVjIoZHgsMCk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBWMigwLGR5KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgUmVjdC5wcm90b3R5cGUuY29sbGlzaW9uVmVjdG9yID0gZnVuY3Rpb24oYil7XG4gICAgICAgIHJldHVybiBuZXcgVjIoIFxuICAgICAgICAgICAgYm91bmRFc2NhcGVEaXN0KHRoaXMueCwgdGhpcy5teCwgYi54LCBiLm14KSxcbiAgICAgICAgICAgIGJvdW5kRXNjYXBlRGlzdCh0aGlzLnksIHRoaXMubXksIGIueSwgYi5teSkgIFxuICAgICAgICApO1xuICAgIH07XG5cbiAgICBSZWN0LnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbih2ZWMpe1xuICAgICAgICByZXR1cm4gbmV3IFJlY3QodGhpcy54K3ZlYy54LHRoaXMueSt2ZWMueSx0aGlzLnN4LHRoaXMuc3kpO1xuICAgIH07XG5cbiAgICBSZWN0LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiBcIltcIit0aGlzLmN4K1wiLFwiK3RoaXMuY3krXCJ8XCIrdGhpcy5zeCtcIixcIit0aGlzLnN5K1wiXVwiO1xuICAgIH07XG5cbn0pKHR5cGVvZiBleHBvcnRzID09PSAndW5kZWZpbmVkJyA/ICggdGhpcy5tb2R1bGEgfHwgKHRoaXMubW9kdWxhID0ge30pKSA6IGV4cG9ydHMgKTtcbiIsIlxuLyogLS0tLS0gMkQgU2NlbmUtR3JhcGggVHJhbnNmb3JtcyAtLS0tLSAqL1xuXG4oZnVuY3Rpb24obW9kdWxhKXtcblxuICAgIHZhciBWMiA9IG1vZHVsYS5WMiB8fCB0eXBlb2YgJ3JlcXVpcmUnICE9PSAndW5kZWZpbmVkJyA/IHJlcXVpcmUoJy4vVjIuanMnKS5WMiA6IG51bGw7XG4gICAgaWYoIVYyKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtb2R1bGEuVHJhbnNmb3JtMiByZXF1aXJlcyBtb2R1bGEuVjInKTtcbiAgICB9XG4gICAgdmFyIE1hdDMgPSBtb2R1bGEuTWF0MyB8fCB0eXBlb2YgJ3JlcXVpcmUnICE9PSAndW5kZWZpbmVkJyA/IHJlcXVpcmUoJy4vTWF0My5qcycpLk1hdDMgOiBudWxsO1xuICAgIGlmKCFNYXQzKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtb2R1bGEuVHJhbnNmb3JtMiByZXF1aXJlcyBtb2R1bGEuTWF0MycpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIFRyYW5zZm9ybTIodHIpe1xuICAgICAgICB0ciA9IHRyIHx8IHt9O1xuICAgICAgICB0aGlzLnBvcyA9IHRyLnBvcyA/IHRyLnBvcy5jbG9uZSgpIDogbmV3IFYyKCk7XG4gICAgICAgIGlmKHRyLnNjYWxlKXtcbiAgICAgICAgICAgIGlmKHR5cGVvZiB0ci5zY2FsZSA9PT0gJ251bWJlcicpe1xuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGUgPSBuZXcgVjIodHIuc2NhbGUsdHIuc2NhbGUpO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZSA9IHRyLnNjYWxlLmNsb25lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgdGhpcy5zY2FsZSA9IG5ldyBWMigxLDEpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucm90YXRpb24gPSB0ci5yb3RhdGlvbiAhPT0gdW5kZWZpbmVkID8gdHIucm90YXRpb24gOiAwO1xuXG4gICAgICAgIHRoaXMucGFyZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5jaGlsZHMgPSBbXTtcblxuICAgICAgICBpZih0ci5wYXJlbnQpe1xuICAgICAgICAgICAgdHIucGFyZW50LmFkZENoaWxkKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRyLmNoaWxkcyl7XG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSB0ci5jaGlsZHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkQ2hpbGQodHIuY2hpbGRzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxvY2FsVG9QYXJlbnRNYXRyaXggPSBudWxsO1xuICAgICAgICB0aGlzLnBhcmVudFRvTG9jYWxNYXRyaXggPSBudWxsO1xuICAgICAgICB0aGlzLmxvY2FsVG9Xb3JsZE1hdHJpeCAgPSBudWxsO1xuICAgICAgICB0aGlzLndvcmxkVG9Mb2NhbE1hdHJpeCAgPSBudWxsO1xuICAgIH1cblxuICAgIG1vZHVsYS5UcmFuc2Zvcm0yID0gVHJhbnNmb3JtMjtcblxuICAgIHZhciBwcm90byA9IFRyYW5zZm9ybTIucHJvdG90eXBlO1xuXG4gICAgdmFyIGVwc2lsb24gPSAwLjAwMDAwMDAxO1xuXG4gICAgdmFyIGVwc2lsb25FcXVhbHMgPSBmdW5jdGlvbihhLGIpe1xuICAgICAgICByZXR1cm4gTWF0aC5hYnMoYS1iKSA8PSBlcHNpbG9uO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiByZXNldF9tYXRyaXgodHIpe1xuICAgICAgICBpZih0ci5sb2NhbFRvUGFyZW50TWF0cml4KXtcbiAgICAgICAgICAgIHRyLmxvY2FsVG9QYXJlbnRNYXRyaXggPSBudWxsO1xuICAgICAgICAgICAgdHIucGFyZW50VG9Mb2NhbE1hdHJpeCA9IG51bGw7XG4gICAgICAgICAgICB0ci5sb2NhbFRvV29ybGRNYXRyaXggID0gbnVsbDtcbiAgICAgICAgICAgIHRyLndvcmxkVG9Mb2NhbE1hdHJpeCAgPSBudWxsO1xuICAgICAgICAgICAgZm9yKHZhciBpID0gMCwgbGVuID0gdHIuY2hpbGRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgICAgICAgICByZXNldF9tYXRyaXgodHIuY2hpbGRzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VfbWF0cml4KHRyKXtcbiAgICAgICAgaWYoIXRyLmxvY2FsVG9QYXJlbnRNYXRyaXgpe1xuICAgICAgICAgICAgdHIubG9jYWxUb1BhcmVudE1hdHJpeCA9IE1hdDMudHJhbnNmb3JtKHRyLnBvcyx0ci5zY2FsZSx0ci5yb3RhdGlvbik7XG4gICAgICAgICAgICB0ci5wYXJlbnRUb0xvY2FsTWF0cml4ID0gdHIubG9jYWxUb1BhcmVudE1hdHJpeC5pbnZlcnQoKTtcbiAgICAgICAgICAgIGlmKHRyLnBhcmVudCl7XG4gICAgICAgICAgICAgICAgbWFrZV9tYXRyaXgodHIucGFyZW50KTtcbiAgICAgICAgICAgICAgICAvLyB0ci5sb2NhbFRvV29ybGRNYXRyaXggPSB0ci5wYXJlbnQubG9jYWxUb1dvcmxkTWF0cml4Lm11bHQodHIubG9jYWxUb1BhcmVudE1hdHJpeCk7IFxuICAgICAgICAgICAgICAgIHRyLmxvY2FsVG9Xb3JsZE1hdHJpeCA9IHRyLmxvY2FsVG9QYXJlbnRNYXRyaXgubXVsdCh0ci5wYXJlbnQubG9jYWxUb1dvcmxkTWF0cml4KTsgIC8vSU5WRVJURURcbiAgICAgICAgICAgICAgICB0ci53b3JsZFRvTG9jYWxNYXRyaXggPSB0ci5sb2NhbFRvV29ybGRNYXRyaXguaW52ZXJ0KCk7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICB0ci5sb2NhbFRvV29ybGRNYXRyaXggPSB0ci5sb2NhbFRvUGFyZW50TWF0cml4O1xuICAgICAgICAgICAgICAgIHRyLndvcmxkVG9Mb2NhbE1hdHJpeCA9IHRyLnBhcmVudFRvTG9jYWxNYXRyaXg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90by5nZXRMb2NhbFRvUGFyZW50TWF0cml4ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgaWYoIXRoaXMubG9jYWxUb1BhcmVudE1hdHJpeCl7XG4gICAgICAgICAgICBtYWtlX21hdHJpeCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5sb2NhbFRvUGFyZW50TWF0cml4O1xuICAgIH07XG5cbiAgICBwcm90by5nZXRQYXJlbnRUb0xvY2FsTWF0cml4ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgaWYoIXRoaXMucGFyZW50VG9Mb2NhbE1hdHJpeCl7XG4gICAgICAgICAgICBtYWtlX21hdHJpeCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnRUb0xvY2FsTWF0cml4O1xuICAgIH07XG4gICAgXG4gICAgcHJvdG8uZ2V0TG9jYWxUb1dvcmxkTWF0cml4ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgaWYoIXRoaXMubG9jYWxUb1dvcmxkTWF0cml4KXtcbiAgICAgICAgICAgIG1ha2VfbWF0cml4KHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmxvY2FsVG9Xb3JsZE1hdHJpeDtcbiAgICB9O1xuICAgIFxuICAgIHByb3RvLmdldFdvcmxkVG9Mb2NhbE1hdHJpeCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGlmKCF0aGlzLndvcmxkVG9Mb2NhbE1hdHJpeCl7XG4gICAgICAgICAgICBtYWtlX21hdHJpeCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy53b3JsZFRvTG9jYWxNYXRyaXg7XG4gICAgfTtcbiAgICBcbiAgICBwcm90by5nZXREaXN0YW50VG9Mb2NhbE1hdHJpeCA9IGZ1bmN0aW9uKGRpc3Qpe1xuICAgICAgICAvL3JldHVybiB0aGlzLmdldFdvcmxkVG9Mb2NhbE1hdHJpeCgpLm11bHQoZGlzdC5nZXRMb2NhbFRvV29ybGRNYXRyaXgoKSk7XG4gICAgICAgIHJldHVybiBkaXN0LmdldExvY2FsVG9Xb3JsZE1hdHJpeCgpLm11bHQodGhpcy5nZXRXb3JsZFRvTG9jYWxNYXRyaXgoKSk7XG4gICAgfTtcbiAgICBcbiAgICBwcm90by5nZXRMb2NhbFRvRGlzdGFudE1hdHJpeCA9IGZ1bmN0aW9uKGRpc3Qpe1xuICAgICAgICAvL3JldHVybiB0aGlzLmdldExvY2FsVG9Xb3JsZE1hdHJpeCgpLm11bHQoZGlzdC5nZXRXb3JsZFRvTG9jYWxNYXRyaXgoKSk7XG4gICAgICAgIHJldHVybiBkaXN0LmdldFdvcmxkVG9Mb2NhbE1hdHJpeCgpLm11bHQodGhpcy5nZXRMb2NhbFRvV29ybGRNYXRyaXgoKSk7IC8vRklYTUUgbG9va3MgZmlzaHkgLi4uXG4gICAgfTtcbiAgICBcbiAgICBwcm90by5lcXVhbHMgPSBmdW5jdGlvbih0cil7XG4gICAgICAgIHJldHVybiAgdGhpcy5mdWxsVHlwZSA9PT0gdHIuZnVsbFR5cGUgJiZcbiAgICAgICAgICAgIHRoaXMucG9zLmVxdWFscyh0ci5wb3MpICYmXG4gICAgICAgICAgICBlcHNpbG9uRXF1YWxzKHRoaXMucm90YXRpb24sIHRyLnJvdGF0aW9uKSAmJlxuICAgICAgICAgICAgZXBzaWxvbkVxdWFscyh0aGlzLnNjYWxlLngsIHRyLnNjYWxlLnkpO1xuICAgIH07XG4gICAgXG4gICAgcHJvdG8uY2xvbmUgPSBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgdHIgPSBuZXcgVHJhbnNmb3JtMigpO1xuICAgICAgICB0ci5wb3MgID0gdGhpcy5wb3MuY2xvbmUoKTtcbiAgICAgICAgdHIuc2NhbGUgPSB0aGlzLnNjYWxlLmNsb25lKCk7XG4gICAgICAgIHRyLnJvdGF0aW9uID0gdGhpcy5yb3RhdGlvbjtcbiAgICAgICAgcmV0dXJuIHRyO1xuICAgIH07XG4gICAgXG4gICAgcHJvdG8uc2V0UG9zID0gZnVuY3Rpb24odmVjKXtcbiAgICAgICAgdGhpcy5wb3MueCA9IHZlYy54O1xuICAgICAgICB0aGlzLnBvcy55ID0gdmVjLnk7XG4gICAgICAgIHJlc2V0X21hdHJpeCh0aGlzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBcbiAgICBwcm90by5zZXRTY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcbiAgICAgICAgaWYoKHR5cGVvZiBzY2FsZSkgPT09ICdudW1iZXInKXtcbiAgICAgICAgICAgIHRoaXMuc2NhbGUueCA9IHNjYWxlO1xuICAgICAgICAgICAgdGhpcy5zY2FsZS55ID0gc2NhbGU7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgdGhpcy5zY2FsZS54ID0gc2NhbGUueDsgXG4gICAgICAgICAgICB0aGlzLnNjYWxlLnkgPSBzY2FsZS55OyBcbiAgICAgICAgfVxuICAgICAgICByZXNldF9tYXRyaXgodGhpcyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgXG4gICAgcHJvdG8uc2V0Um90YXRpb24gPSBmdW5jdGlvbihyb3RhdGlvbil7XG4gICAgICAgIHRoaXMucm90YXRpb24gPSByb3RhdGlvbjtcbiAgICAgICAgcmVzZXRfbWF0cml4KHRoaXMpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFxuICAgIHByb3RvLmdldFBvcyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiB0aGlzLnBvcy5jbG9uZSgpO1xuICAgIH07XG4gICAgXG4gICAgcHJvdG8uZ2V0U2NhbGUgPSBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4gdGhpcy5zY2FsZS5jbG9uZSgpO1xuICAgIH07XG4gICAgXG4gICAgcHJvdG8uZ2V0U2NhbGVGYWMgPSBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4gTWF0aC5tYXgodGhpcy5zY2FsZS54LHRoaXMuc2NhbGUueSk7XG4gICAgfTtcbiAgICBcbiAgICBwcm90by5nZXRSb3RhdGlvbiA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiB0aGlzLnJvdGF0aW9uO1xuICAgIH07XG4gICAgXG4gICAgcHJvdG8uZ2V0V29ybGRQb3MgPSBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRMb2NhbFRvV29ybGRNYXRyaXgoKS5tdWx0KFYyLnplcm8pO1xuICAgIH07XG4gICAgXG4gICAgcHJvdG8ucGFyZW50VG9Mb2NhbCA9IGZ1bmN0aW9uKHZlYyl7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFBhcmVudFRvTG9jYWxNYXRyaXgoKS5tdWx0KHZlYyk7XG4gICAgfTtcbiAgICBcbiAgICBwcm90by53b3JsZFRvTG9jYWwgPSBmdW5jdGlvbih2ZWMpe1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRXb3JsZFRvTG9jYWxNYXRyaXgoKS5tdWx0KHZlYyk7XG4gICAgfTtcbiAgICBcbiAgICBwcm90by5sb2NhbFRvUGFyZW50ID0gZnVuY3Rpb24odmVjKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxUb1BhcmVudE1hdHJpeCgpLm11bHQodmVjKTtcbiAgICB9O1xuICAgIFxuICAgIHByb3RvLmxvY2FsVG9Xb3JsZCA9IGZ1bmN0aW9uKHZlYyl7XG4gICAgICAgIHJldHVybiB0aGlzLmdldExvY2FsVG9Xb3JsZE1hdHJpeCgpLm11bHQodmVjKTtcbiAgICB9O1xuICAgIFxuICAgIHByb3RvLmRpc3RhbnRUb0xvY2FsID0gZnVuY3Rpb24oZGlzdFRyYW5zZm9ybSwgdmVjKXtcbiAgICAgICAgdmVjID0gZGlzdFRyYW5zZm9ybS5sb2NhbFRvV29ybGQodmVjKTtcbiAgICAgICAgcmV0dXJuIHRoaXMud29ybGRUb0xvY2FsKHZlYyk7XG4gICAgfTtcblxuICAgIHByb3RvLmxvY2FsVG9EaXN0YW50ID0gZnVuY3Rpb24oZGlzdCwgdmVjKXtcbiAgICAgICAgdmVjID0gdGhpcy5sb2NhbFRvV29ybGQodmVjKTtcbiAgICAgICAgcmV0dXJuIGRpc3Qud29ybGRUb0xvY2FsKHZlYyk7XG4gICAgfTtcblxuICAgIHByb3RvLlggPSBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4gdGhpcy5sb2NhbFRvV29ybGQoVjIueCkuc3ViKHRoaXMuZ2V0V29ybGRQb3MoKSkubm9ybWFsaXplKCk7XG4gICAgfTtcbiAgICBcbiAgICBwcm90by5ZID0gZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxUb1dvcmxkKFYyLnkpLnN1Yih0aGlzLmdldFdvcmxkUG9zKCkpLm5vcm1hbGl6ZSgpO1xuICAgIH07XG5cbiAgICBwcm90by5kaXN0ID0gZnVuY3Rpb24odHIpe1xuICAgICAgICByZXR1cm4gdHIuZ2V0V29ybGRQb3MoKS5zdWIodGhpcy5nZXRXb3JsZFBvcygpKTtcbiAgICB9O1xuICAgIFxuICAgIHByb3RvLmFkZENoaWxkID0gZnVuY3Rpb24odHIpe1xuICAgICAgICBpZih0ci5wYXJlbnQgIT09IHRoaXMpe1xuICAgICAgICAgICAgdHIubWFrZVJvb3QoKTtcbiAgICAgICAgICAgIHRyLnBhcmVudCA9IHRoaXM7XG4gICAgICAgICAgICB0aGlzLmNoaWxkcy5wdXNoKHRyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFxuICAgIHByb3RvLnJlbUNoaWxkID0gZnVuY3Rpb24odHIpe1xuICAgICAgICBpZih0ciAmJiB0ci5wYXJlbnQgPT09IHRoaXMpe1xuICAgICAgICAgICAgdHIubWFrZVJvb3QoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFxuICAgIHByb3RvLmdldENoaWxkQ291bnQgPSBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4gdGhpcy5jaGlsZHMubGVuZ3RoO1xuICAgIH07XG4gICAgXG4gICAgcHJvdG8uZ2V0Q2hpbGQgPSBmdW5jdGlvbihpbmRleCl7XG4gICAgICAgIHJldHVybiB0aGlzLmNoaWxkc1tpbmRleF07XG4gICAgfTtcbiAgICBcbiAgICBwcm90by5nZXRSb290ICA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGlmKHRoaXMucGFyZW50KXtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcmVudC5nZXRSb290KCk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFxuICAgIHByb3RvLm1ha2VSb290ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgaWYodGhpcy5wYXJlbnQpe1xuICAgICAgICAgICAgdmFyIHBjaGlsZHMgPSB0aGlzLnBhcmVudC5jaGlsZHM7XG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgcGNoaWxkcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgd2hpbGUocGNoaWxkc1tpXSA9PT0gdGhpcyl7XG4gICAgICAgICAgICAgICAgICAgIHBjaGlsZHMuc3BsaWNlKGksMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5wYXJlbnQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgXG4gICAgcHJvdG8uaXNMZWFmICAgPSBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy5jaGlsZHMubGVuZ3RoID09PSAwOyB9O1xuICAgIFxuICAgIHByb3RvLmlzUm9vdCAgID0gZnVuY3Rpb24oKXsgcmV0dXJuICF0aGlzLnBhcmVudDsgfTtcbiAgICBcbiAgICBwcm90by5yb3RhdGUgPSBmdW5jdGlvbihhbmdsZSl7IFxuICAgICAgICB0aGlzLnJvdGF0aW9uICs9IGFuZ2xlO1xuICAgICAgICByZXNldF9tYXRyaXgodGhpcyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgXG4gICAgcHJvdG8uc2NhbGUgPSBmdW5jdGlvbihzY2FsZSl7XG4gICAgICAgIHRoaXMuc2NhbGUueCAqPSBzY2FsZS54O1xuICAgICAgICB0aGlzLnNjYWxlLnkgKj0gc2NhbGUueTtcbiAgICAgICAgcmVzZXRfbWF0cml4KHRoaXMpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFxuICAgIHByb3RvLnNjYWxlRmFjID0gZnVuY3Rpb24oZil7XG4gICAgICAgIHRoaXMuc2NhbGUueCAqPSBmO1xuICAgICAgICB0aGlzLnNjYWxlLnkgKj0gZjtcbiAgICAgICAgcmVzZXRfbWF0cml4KHRoaXMpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFxuICAgIHByb3RvLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKGRlbHRhUG9zKXtcbiAgICAgICAgdGhpcy5wb3MueCArPSBkZWx0YVBvcy54O1xuICAgICAgICB0aGlzLnBvcy55ICs9IGRlbHRhUG9zLnk7XG4gICAgICAgIHJlc2V0X21hdHJpeCh0aGlzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxufSkodHlwZW9mIGV4cG9ydHMgPT09ICd1bmRlZmluZWQnID8gKCB0aGlzLm1vZHVsYSB8fCAodGhpcy5tb2R1bGEgPSB7fSkpIDogZXhwb3J0cyApO1xuIiwiXG4vKiAtLS0tLSAyRCBWZWN0b3JzIC0tLS0tICovXG5cbihmdW5jdGlvbihtb2R1bGEpe1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIFxuICAgIGZ1bmN0aW9uIFYyKCl7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIGlmICghdGhpcyB8fCB0aGlzLmNvbnN0cnVjdG9yICE9PSBWMil7XG4gICAgICAgICAgICBzZWxmID0gbmV3IFYyKCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBhbGVuID0gYXJndW1lbnRzLmxlbmd0aDsgICAgICBcbiAgICAgICAgXG4gICAgICAgIGlmIChhbGVuID09PSAwKXtcbiAgICAgICAgICAgIHNlbGYueCA9IDA7XG4gICAgICAgICAgICBzZWxmLnkgPSAwO1xuICAgICAgICB9ZWxzZSBpZiAoYWxlbiA9PT0gMSl7XG4gICAgICAgICAgICB2YXIgYXJnID0gYXJndW1lbnRzWzBdO1xuICAgICAgICAgICAgaWYodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpe1xuICAgICAgICAgICAgICAgIHNlbGYueCA9IGFyZztcbiAgICAgICAgICAgICAgICBzZWxmLnkgPSBhcmc7XG4gICAgICAgICAgICB9ZWxzZSBpZihhcmdbMF0gIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICAgICAgc2VsZi54ID0gYXJnWzBdIHx8IDA7XG4gICAgICAgICAgICAgICAgc2VsZi55ID0gYXJnWzFdIHx8IDA7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICBzZWxmLnggPSBhcmcueCB8fCAwO1xuICAgICAgICAgICAgICAgIHNlbGYueSA9IGFyZy55IHx8IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1lbHNlIGlmIChhbGVuID49IDIpe1xuICAgICAgICAgICAgc2VsZi54ID0gYXJndW1lbnRzWzBdO1xuICAgICAgICAgICAgc2VsZi55ID0gYXJndW1lbnRzWzFdO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICB9XG5cbiAgICBtb2R1bGEuVjIgPSBWMjtcblxuICAgIHZhciBwcm90byA9IFYyLnByb3RvdHlwZTtcbiAgICBcbiAgICBWMi56ZXJvICAgPSBuZXcgVjIoKTtcbiAgICBWMi54ICAgICAgPSBuZXcgVjIoMSwwKTtcbiAgICBWMi55ICAgICAgPSBuZXcgVjIoMCwxKTtcblxuICAgIHZhciB0bXAgICA9IG5ldyBWMigpO1xuXG4gICAgdmFyIGVwc2lsb24gPSAwLjAwMDAwMDAxO1xuICAgIFxuICAgIC8vIHNldHMgdmQgdG8gYSB2ZWN0b3Igb2YgbGVuZ3RoICdsZW4nIGFuZCBhbmdsZSAnYW5nbGUnIHJhZGlhbnNcbiAgICBWMi5zZXRQb2xhciA9IGZ1bmN0aW9uKHZkLGxlbixhbmdsZSl7XG4gICAgICAgIHZkLnggPSBsZW47XG4gICAgICAgIHZkLnkgPSAwO1xuICAgICAgICBWMi5yb3RhdGUodmQsYW5nbGUpO1xuICAgICAgICByZXR1cm4gdmQ7XG4gICAgfTtcblxuICAgIFYyLnBvbGFyID0gZnVuY3Rpb24obGVuLGFuZ2xlKXtcbiAgICAgICAgdmFyIHYgPSBuZXcgVjIoKTtcbiAgICAgICAgVjIuc2V0UG9sYXIodixsZW4sYW5nbGUpO1xuICAgICAgICByZXR1cm4gdjtcbiAgICB9O1xuXG4gICAgVjIucmFuZG9tID0gZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIG5ldyBWMihNYXRoLnJhbmRvbSgpKjIgLSAxLCBNYXRoLnJhbmRvbSgpKjIgLSAxKTtcbiAgICB9O1xuXG4gICAgVjIucmFuZG9tUG9zaXRpdmUgPSBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4gbmV3IFYyKE1hdGgucmFuZG9tKCksTWF0aC5yYW5kb20oKSk7XG4gICAgfTtcblxuICAgIFYyLnJhbmRvbURpc2MgPSBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgdiA9IG5ldyBWMigpO1xuICAgICAgICBkb3tcbiAgICAgICAgICAgIHYueCA9IE1hdGgucmFuZG9tKCkgKiAyIC0gMTtcbiAgICAgICAgICAgIHYueSA9IE1hdGgucmFuZG9tKCkgKiAyIC0gMTtcbiAgICAgICAgfXdoaWxlKHYubGVuU3EoKSA+IDEpO1xuICAgICAgICByZXR1cm4gdjtcbiAgICB9O1xuXG4gICAgVjIuaXNaZXJvICA9IGZ1bmN0aW9uKHYpe1xuICAgICAgICByZXR1cm4gTWF0aC5hYnModi54KSA8PSBlcHNpbG9uICYmIE1hdGguYWJzKHYueSkgPD0gZXBzaWxvbjtcbiAgICB9O1xuXG4gICAgcHJvdG8uaXNaZXJvID0gZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIE1hdGguYWJzKHRoaXMueCkgPD0gZXBzaWxvbiAmJiBNYXRoLmFicyh0aGlzLnkpIDw9IGVwc2lsb247XG4gICAgfTtcblxuICAgIFYyLmlzTmFOID0gZnVuY3Rpb24odil7XG4gICAgICAgIHJldHVybiBOdW1iZXIuaXNOYU4odi54KSB8fCBOdW1iZXIuaXNOYU4odi55KTtcbiAgICB9O1xuXG4gICAgcHJvdG8uaXNOYU4gPSBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4gVjIuaXNOYU4odGhpcyk7XG4gICAgfTtcblxuXG4gICAgVjIubGVuID0gZnVuY3Rpb24odil7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQodi54KnYueCArIHYueSp2LnkpO1xuICAgIH07XG5cbiAgICBwcm90by5sZW4gPSBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMueCp0aGlzLnggKyB0aGlzLnkqdGhpcy55KTtcbiAgICB9O1xuXG4gICAgVjIubGVuU3EgPSBmdW5jdGlvbih2KXtcbiAgICAgICAgcmV0dXJuIHYueCp2LnggKyB2Lnkqdi55O1xuICAgIH07XG4gICAgXG4gICAgcHJvdG8ubGVuU3EgPSBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4gdGhpcy54KnRoaXMueCArIHRoaXMueSp0aGlzLnk7XG4gICAgfTtcbiAgICBcbiAgICBWMi5kaXN0ID0gZnVuY3Rpb24odjEsdjIpe1xuICAgICAgICB2YXIgZHggPSB2MS54IC0gdjIueDtcbiAgICAgICAgdmFyIGR5ID0gdjEueSAtIHYyLnk7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoZHgqZHggKyBkeSpkeSk7XG4gICAgfTtcblxuICAgIHByb3RvLmRpc3QgPSBmdW5jdGlvbih2KXtcbiAgICAgICAgcmV0dXJuIFYyLmRpc3QodGhpcyx2KTtcbiAgICB9O1xuICAgIFxuICAgIFYyLmRpc3RTcSA9IGZ1bmN0aW9uKHYxLHYyKXtcbiAgICAgICAgdmFyIGR4ID0gdjEueCAtIHYyLng7XG4gICAgICAgIHZhciBkeSA9IHYxLnkgLSB2Mi55O1xuICAgICAgICByZXR1cm4gZHgqZHggKyBkeSpkeTtcbiAgICB9O1xuXG4gICAgcHJvdG8uZGlzdFNxID0gZnVuY3Rpb24odil7XG4gICAgICAgIHJldHVybiBWMi5kaXN0U3EodGhpcyx2KTtcbiAgICB9O1xuICAgIFxuICAgIFYyLmRvdCA9IGZ1bmN0aW9uKHYxLHYyKXtcbiAgICAgICAgcmV0dXJuIHYxLngqdjIueCArIHYyLnkqdjIueTtcbiAgICB9O1xuXG4gICAgcHJvdG8uZG90ID0gZnVuY3Rpb24odil7XG4gICAgICAgIHJldHVybiB0aGlzLngqdi54ICsgdGhpcy55KnYueTtcbiAgICB9O1xuICAgIFxuICAgIFYyLnNldCAgPSBmdW5jdGlvbih2ZCx2eCx2eSl7XG4gICAgICAgIHZkLnggPSB2eDtcbiAgICAgICAgdmQueSA9IHZ5O1xuICAgICAgICByZXR1cm4gdmQ7XG4gICAgfTtcbiAgICBcbiAgICBWMi5zZXRBcnJheSA9IGZ1bmN0aW9uKHZkLGFycmF5LG9mZnNldCl7XG4gICAgICAgIG9mZnNldCA9IG9mZnNldCB8fCAwO1xuICAgICAgICB2ZC54ID0gYXJyYXlbb2Zmc2V0XTtcbiAgICAgICAgdmQueSA9IGFycmF5W29mZnNldCsxXTtcbiAgICAgICAgcmV0dXJuIHZkO1xuICAgIH07XG5cblxuICAgIFYyLmNvcHkgPSBmdW5jdGlvbih2ZCx2KXtcbiAgICAgICAgdmQueCA9IHYueDtcbiAgICAgICAgdmQueSA9IHYueTtcbiAgICAgICAgcmV0dXJuIHZkO1xuICAgIH07XG5cbiAgICBwcm90by5jb3B5ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIG5ldyBWMih0aGlzLngsdGhpcy55KTtcbiAgICB9O1xuICAgIFxuICAgIFYyLmFkZCA9IGZ1bmN0aW9uKHZkLHYpe1xuICAgICAgICB2ZC54ICs9IHYueDtcbiAgICAgICAgdmQueSArPSB2Lng7XG4gICAgICAgIHJldHVybiB2ZDtcbiAgICB9O1xuXG4gICAgcHJvdG8uYWRkID0gZnVuY3Rpb24odil7XG4gICAgICAgIHJldHVybiBuZXcgVjIodGhpcy54K3YueCx0aGlzLnkrdi55KTtcbiAgICB9O1xuICAgIFxuICAgIFYyLmFkZFNjYWxlZCA9IGZ1bmN0aW9uKHZkLHYsc2NhbGUpe1xuICAgICAgICB2ZC54ICs9IHYueCAqIHNjYWxlO1xuICAgICAgICB2ZC55ICs9IHYueSAqIHNjYWxlO1xuICAgICAgICByZXR1cm4gdmQ7XG4gICAgfTtcblxuICAgIHByb3RvLmFkZFNjYWxlZCA9IGZ1bmN0aW9uKHYsc2NhbGUpe1xuICAgICAgICB2YXIgdmQgPSBuZXcgVjIoKTtcbiAgICAgICAgVjIuY29weSh2ZCx0aGlzKTtcbiAgICAgICAgVjIuYWRkU2NhbGVkKHZkLHYsc2NhbGUpO1xuICAgICAgICByZXR1cm4gdmQ7XG4gICAgfTtcbiAgICBcbiAgICBWMi5zdWIgPSBmdW5jdGlvbih2ZCx2KXtcbiAgICAgICAgdmQueCAtPSB2Lng7XG4gICAgICAgIHZkLnkgLT0gdi55O1xuICAgICAgICByZXR1cm4gdmQ7XG4gICAgfTtcblxuICAgIHByb3RvLnN1YiA9IGZ1bmN0aW9uKHYpe1xuICAgICAgICByZXR1cm4gbmV3IFYyKHRoaXMueC12LngsdGhpcy55LXYueSk7XG4gICAgfTtcblxuICAgIFYyLm11bHQgPSBmdW5jdGlvbih2ZCx2KXtcbiAgICAgICAgdmQueCAqPSB2Lng7XG4gICAgICAgIHZkLnkgKj0gdi55O1xuICAgICAgICByZXR1cm4gdmQ7XG4gICAgfTtcblxuICAgIHByb3RvLm11bHQgPSBmdW5jdGlvbih2KXtcbiAgICAgICAgaWYodHlwZW9mIHYgPT09ICdudW1iZXInKXtcbiAgICAgICAgICAgIHJldHVybiBuZXcgVjIodGhpcy54KnYsdGhpcy55KnYpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHJldHVybiBuZXcgVjIodGhpcy54KnYueCx0aGlzLnkqdi55KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgVjIuc2NhbGUgPSBmdW5jdGlvbih2ZCxmKXtcbiAgICAgICAgdmQueCAqPSBmO1xuICAgICAgICB2ZC55ICo9IGY7XG4gICAgICAgIHJldHVybiB2ZDtcbiAgICB9O1xuICAgIFxuICAgIHByb3RvLnNjYWxlID0gZnVuY3Rpb24oZil7XG4gICAgICAgIHJldHVybiBuZXcgVjIodGhpcy54KmYsIHRoaXMueSpmKTtcbiAgICB9O1xuICAgIFxuICAgIFYyLm5lZyA9IGZ1bmN0aW9uKHZkKXtcbiAgICAgICAgdmQueCA9IC12ZC54O1xuICAgICAgICB2ZC55ID0gLXZkLnk7XG4gICAgICAgIHJldHVybiB2ZDtcbiAgICB9O1xuXG4gICAgcHJvdG8ubmVnID0gZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIG5ldyBWMigtdGhpcy54LC10aGlzLnkpO1xuICAgIH07XG5cbiAgICBWMi5kaXYgPSBmdW5jdGlvbih2ZCx2KXtcbiAgICAgICAgdmQueCA9IHZkLnggLyB2Lng7XG4gICAgICAgIHZkLnkgPSB2ZC55IC8gdi55O1xuICAgICAgICByZXR1cm4gdmQ7XG4gICAgfTtcblxuICAgIHByb3RvLmRpdiA9IGZ1bmN0aW9uKHYpe1xuICAgICAgICByZXR1cm4gbmV3IFYyKHRoaXMueC92LngsdGhpcy55L3YueSk7XG4gICAgfTtcblxuICAgIFYyLmludmVydCA9IGZ1bmN0aW9uKHZkKXtcbiAgICAgICAgdmQueCA9IDEuMC92ZC54O1xuICAgICAgICB2ZC55ID0gMS4wL3ZkLnk7XG4gICAgICAgIHJldHVybiB2ZDtcbiAgICB9O1xuXG4gICAgcHJvdG8uaW52ZXJ0ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIG5ldyBWMigxL3RoaXMueCwxL3RoaXMueSk7XG4gICAgfTtcblxuICAgIFYyLnBvdyA9IGZ1bmN0aW9uKHZkLHBvdyl7XG4gICAgICAgIHZkLnggPSBNYXRoLnBvdyh2ZC54LHBvdyk7XG4gICAgICAgIHZkLnkgPSBNYXRoLnBvdyh2ZC55LHBvdyk7XG4gICAgICAgIHJldHVybiB2ZDtcbiAgICB9O1xuXG4gICAgcHJvdG8ucG93ID0gZnVuY3Rpb24ocG93KXtcbiAgICAgICAgcmV0dXJuIG5ldyBWMihNYXRoLnBvdyh0aGlzLngscG93KSwgTWF0aC5wb3codGhpcy55LHBvdykpO1xuICAgIH07XG5cbiAgICBWMi5zcSA9IGZ1bmN0aW9uKHZkKXtcbiAgICAgICAgdmQueCA9IHZkLnggKiB2ZC54O1xuICAgICAgICB2ZC55ID0gdmQueSAqIHZkLnk7XG4gICAgICAgIHJldHVybiB2ZDtcbiAgICB9O1xuICAgIFxuICAgIHByb3RvLnNxID0gZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIG5ldyBWMih0aGlzLngqdGhpcy54LHRoaXMueSp0aGlzLnkpO1xuICAgIH07XG4gICBcbiAgICBWMi5ub3JtYWxpemUgPSBmdW5jdGlvbih2ZCl7XG4gICAgICAgIHZhciBsZW4gPSB2ZC5sZW5TcSgpO1xuICAgICAgICBpZihsZW4gPT09IDApe1xuICAgICAgICAgICAgdmQueCA9IDE7XG4gICAgICAgICAgICB2ZC55ID0gMDtcbiAgICAgICAgfWVsc2UgaWYobGVuICE9PSAxKXtcbiAgICAgICAgICAgIGxlbiA9IDEgLyBNYXRoLnNxcnQobGVuKTtcbiAgICAgICAgICAgIHZkLnggPSB2ZC54ICogbGVuO1xuICAgICAgICAgICAgdmQueSA9IHZkLnkgKiBsZW47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZkO1xuICAgIH07XG4gICAgICAgICAgICBcbiAgICBwcm90by5ub3JtYWxpemUgPSBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgdmQgPSBuZXcgVjIoKTtcbiAgICAgICAgVjIuY29weSh2ZCx0aGlzKTtcbiAgICAgICAgVjIubm9ybWFsaXplKHZkKTtcbiAgICAgICAgcmV0dXJuIHZkO1xuICAgIH07XG4gICAgXG4gICAgVjIuc2V0TGVuID0gZnVuY3Rpb24odmQsbCl7XG4gICAgICAgIFYyLm5vcm1hbGl6ZSh2ZCk7XG4gICAgICAgIFYyLnNjYWxlKHZkLGwpO1xuICAgICAgICByZXR1cm4gdmQ7XG4gICAgfTtcblxuICAgIHByb3RvLnNldExlbiA9IGZ1bmN0aW9uKGwpe1xuICAgICAgICB2YXIgdmQgPSBuZXcgVjIoKTtcbiAgICAgICAgVjIuY29weSh2ZCx0aGlzKTtcbiAgICAgICAgVjIuc2V0TGVuKHZkLGwpO1xuICAgICAgICByZXR1cm4gdmQ7XG4gICAgfTtcblxuICAgIFYyLnByb2plY3QgPSBmdW5jdGlvbih2ZCx2KXtcbiAgICAgICAgVjIuY29weSh0bXAsdik7XG4gICAgICAgIFYyLm5vcm1hbGl6ZSh0bXApO1xuICAgICAgICB2YXIgZG90ID0gVjIuZG90KHZkLHRtcCk7XG4gICAgICAgIFYyLmNvcHkodmQsdG1wKTtcbiAgICAgICAgVjIuc2V0TGVuKHZkLGRvdCk7XG4gICAgICAgIHJldHVybiB2ZDtcbiAgICB9O1xuICAgIFxuICAgIHByb3RvLnByb2plY3QgPSBmdW5jdGlvbih2KXtcbiAgICAgICAgdmFyIHZkID0gbmV3IFYyKCk7XG4gICAgICAgIFYyLmNvcHkodmQsdGhpcyk7XG4gICAgICAgIFYyLnByb2plY3QodmQsdik7XG4gICAgICAgIHJldHVybiB2ZDtcbiAgICB9O1xuXG4gICAgcHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgc3RyID0gXCJbXCI7XG4gICAgICAgIHN0ciArPSB0aGlzLnggO1xuICAgICAgICBzdHIgKz0gXCIsXCIgO1xuICAgICAgICBzdHIgKz0gdGhpcy55IDtcbiAgICAgICAgc3RyICs9IFwiXVwiIDtcbiAgICAgICAgcmV0dXJuIHN0cjtcbiAgICB9O1xuICAgIFxuICAgIFxuICAgIFYyLnJvdGF0ZSA9IGZ1bmN0aW9uKHZkLHJhZCl7XG4gICAgICAgIHZhciBjID0gTWF0aC5jb3MocmFkKTtcbiAgICAgICAgdmFyIHMgPSBNYXRoLnNpbihyYWQpO1xuICAgICAgICB2YXIgdnggPSB2ZC54ICogYyAtIHZkLnkgKnM7XG4gICAgICAgIHZhciB2eSA9IHZkLnggKiBzICsgdmQueSAqYztcbiAgICAgICAgdmQueCA9IHZ4O1xuICAgICAgICB2ZC55ID0gdnk7XG4gICAgICAgIHJldHVybiB2ZDtcbiAgICB9O1xuICAgICAgICBcbiAgICBwcm90by5yb3RhdGUgPSBmdW5jdGlvbihyYWQpe1xuICAgICAgICB2YXIgdmQgPSBuZXcgVjIoKTtcbiAgICAgICAgVjIuY29weSh2ZCx0aGlzKTtcbiAgICAgICAgVjIucm90YXRlKHZkLHJhZCk7XG4gICAgICAgIHJldHVybiB2ZDtcbiAgICB9O1xuICAgIFxuICAgIFYyLmxlcnAgPSBmdW5jdGlvbih2ZCx2LGFscGhhKXtcbiAgICAgICAgdmFyIGludkFscGhhID0gMS0gYWxwaGE7XG4gICAgICAgIHZkLnggPSB2ZC54ICogaW52QWxwaGEgKyB2LnggKiBhbHBoYTtcbiAgICAgICAgdmQueSA9IHZkLnkgKiBpbnZBbHBoYSArIHYueSAqIGFscGhhO1xuICAgICAgICByZXR1cm4gdmQ7XG4gICAgfTtcblxuICAgIHByb3RvLmxlcnAgPSBmdW5jdGlvbih2LGFscGhhKXtcbiAgICAgICAgdmFyIHZkID0gbmV3IFYyKCk7XG4gICAgICAgIFYyLmNvcHkodmQsdGhpcyk7XG4gICAgICAgIFYyLmxlcnAodmQsdixhbHBoYSk7XG4gICAgICAgIHJldHVybiB2ZDtcbiAgICB9O1xuICAgIFxuICAgIFYyLmF6aW11dGggPSBmdW5jdGlvbih2KXtcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIodi55LHYueCk7XG4gICAgfTtcblxuICAgIHByb3RvLmF6aW11dGggPSBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4gTWF0aC5hdGFuMih0aGlzLnksdGhpcy54KTtcbiAgICB9O1xuICAgIFxuICAgIFYyLmVxdWFscyA9IGZ1bmN0aW9uKHUsdil7XG4gICAgICAgIHJldHVybiBNYXRoLmFicyh1Lngtdi54KSA8PSBlcHNpbG9uICYmIE1hdGguYWJzKHUueSAtIHYueSkgPD0gZXBzaWxvbjtcbiAgICB9O1xuXG4gICAgcHJvdG8uZXF1YWxzID0gZnVuY3Rpb24odil7XG4gICAgICAgIHJldHVybiBWMi5lcXVhbHModGhpcyx2KTtcbiAgICB9O1xuICAgIFxuICAgIFYyLnJvdW5kICA9IGZ1bmN0aW9uKHZkKXtcbiAgICAgICAgdmQueCA9IE1hdGgucm91bmQodmQueCk7XG4gICAgICAgIHZkLnkgPSBNYXRoLnJvdW5kKHZkLnkpO1xuICAgICAgICByZXR1cm4gdmQ7XG4gICAgfTtcblxuICAgIHByb3RvLnJvdW5kID0gZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIG5ldyBWMihNYXRoLnJvdW5kKHRoaXMueCksTWF0aC5yb3VuZCh0aGlzLnkpKTtcbiAgICB9O1xuXG4gICAgVjIuZmxvb3IgPSBmdW5jdGlvbih2ZCl7XG4gICAgICAgIHZkLnggPSBNYXRoLmZsb29yKHZkLngpO1xuICAgICAgICB2ZC55ID0gTWF0aC5mbG9vcih2ZC55KTtcbiAgICAgICAgcmV0dXJuIHZkO1xuICAgIH07XG5cbiAgICBwcm90by5mbG9vciA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiBuZXcgVjIoTWF0aC5mbG9vcih0aGlzLngpLE1hdGguZmxvb3IodGhpcy55KSk7XG4gICAgfTtcblxuICAgIFYyLmNlaWwgPSBmdW5jdGlvbih2ZCl7XG4gICAgICAgIHZkLnggPSBNYXRoLmNlaWwodmQueCk7XG4gICAgICAgIHZkLnkgPSBNYXRoLmNlaWwodmQueSk7XG4gICAgICAgIHJldHVybiB2ZDtcbiAgICB9O1xuXG4gICAgcHJvdG8uY2VpbCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiBuZXcgVjIoTWF0aC5jZWlsKHRoaXMueCksTWF0aC5jZWlsKHRoaXMueSkpO1xuICAgIH07XG5cbiAgICBWMi5jcm9zc0FyZWEgPSBmdW5jdGlvbih1LHYpe1xuICAgICAgICByZXR1cm4gdS54ICogdi55IC0gdS55ICogdi55O1xuICAgIH07XG5cbiAgICBwcm90by5jcm9zc0FyZWEgPSBmdW5jdGlvbih2KXtcbiAgICAgICAgcmV0dXJuIHRoaXMueCAqIHYueSAtIHRoaXMueSAqIHYueDtcbiAgICB9O1xuXG4gICAgVjIucmVmbGVjdCA9IGZ1bmN0aW9uKHZkLHZuKXtcbiAgICAgICAgVjIuY29weSh0bXAsdm4pO1xuICAgICAgICBWMi5ub3JtYWxpemUodG1wKTtcbiAgICAgICAgdmFyIGRvdDIgPSBWMi5kb3QodmQsdG1wKSAqIDI7XG4gICAgICAgIHZkLnggPSB2ZC54IC0gdm4ueCAqIGRvdDI7XG4gICAgICAgIHZkLnkgPSB2ZC55IC0gdm4ueSAqIGRvdDI7XG4gICAgICAgIHJldHVybiB2ZDtcbiAgICB9O1xuXG4gICAgcHJvdG8ucmVmbGVjdCA9IGZ1bmN0aW9uKHZuKXtcbiAgICAgICAgdmFyIHZkID0gbmV3IFYyKCk7XG4gICAgICAgIFYyLmNvcHkodmQsdGhpcyk7XG4gICAgICAgIFYyLnJlZmxlY3QodmQsdm4pO1xuICAgICAgICByZXR1cm4gdmQ7XG4gICAgfTtcblxuICAgIFYyLnRvQXJyYXkgPSBmdW5jdGlvbihhcnJheSx2LG9mZnNldCl7XG4gICAgICAgIG9mZnNldCA9IG9mZnNldCB8fCAwO1xuICAgICAgICBhcnJheVtvZmZzZXRdICAgPSB2Lng7XG4gICAgICAgIGFycmF5W29mZnNldCsxXSA9IHYueTtcbiAgICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH07XG5cbiAgICBwcm90by5hcnJheSAgID0gZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIFt0aGlzLngsdGhpcy55XTtcbiAgICB9O1xuXG4gICAgcHJvdG8uZmxvYXQzMiA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBhID0gbmV3IEZsb2F0MzJBcnJheSgyKTtcbiAgICAgICAgYVswXSA9IHRoaXMueDtcbiAgICAgICAgYVsxXSA9IHRoaXMueTtcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfTtcblxufSkodHlwZW9mIGV4cG9ydHMgPT09ICd1bmRlZmluZWQnID8gKCB0aGlzLm1vZHVsYSB8fCAodGhpcy5tb2R1bGEgPSB7fSkpIDogZXhwb3J0cyApO1xuXG4iXX0=
