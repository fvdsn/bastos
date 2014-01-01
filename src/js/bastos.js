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

    function Main(options){
        options = options || {};
        this.input = options.input;
        this.scene = options.scene;
        this.renderer  = new Renderer({main:this});
        this.running   = false;
        this.time      = 0;
        this.fps       = 60;
        this.deltaTime = 1 / this.fps;
        this.canvas  = options.canvas;
        this.context = this.canvas.getContext('2d'); 
        this.width   = this.canvas.width;
        this.height  = this.canvas.height;
        this.scale   = 1;
        this.pos     = V2();
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
        attack: function(proj){
            proj.damage();
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

    function GruntProjectile(pos,dir){
        Projectile.call(this,pos,dir);
    }

    extend(GruntProjectile, Projectile, {
        maxSpeed: 150,
        lifetime: 5,
        wallDamage: 0.05,
        render: function(){
            var r = this.main.renderer;
            r.color('red');
            r.disc( 0,0,3);
        },
    });



    function Player(options){
        this.main  = options.main;
        this.game  = options.game;
        this.pos   = V2();
        this.cpos  = V2();
        this.speed = V2();
        this.maxSpeed = 150;
        this.fireInterval = 0.025
        this.fireTime     = 0;
        this.radius = 10;
    }

    Player.prototype = {
        damage: function(){
            this.game.restart();
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
            if(collision){
                this.pos = this.pos.add(collision);
            }

            if(input.down('p')){
                this.main.exit();
            }

            this.aim = this.main.mouse().sub(this.pos).normalize();
            if(input.down('mouse0') && this.main.time >= this.fireTime){
                var spread = Math.max(0.02,Math.min(0.5, 0.5/(1+Math.max(0,-0.4+0.025*this.main.mouse().sub(this.pos).len()))))
                var dir = this.aim.add(V2.randomDisc().scale(spread)).normalize();
                this.game.addPlayerProj(new Projectile(this.pos.add(dir.scale(10)),dir));
                this.fireTime = this.main.time + this.fireInterval;
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
                this.addEnemy(new Grunt({pos:this.player.pos.add(V2.randomDisc().scale(1000))}));
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
