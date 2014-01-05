
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

