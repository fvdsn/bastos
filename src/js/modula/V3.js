
/* ----- 3D Vectors ----- */

(function(modula){

    function V3(){
        var self = this;
        if(this.constructor !== V3){
            self = new V3();
        }
        if(arguments.length === 0){
            self.x = 0;
            self.y = 0;
            self.z = 0;
        }else if (arguments.length === 1){
        	var arg = arguments[0];
        	if  (typeof arg === 'string'){
        		arg = JSON.parse(arg);
        	}
            if(typeof arg === 'number'){
                self.x = arg;
                self.y = arg;
                self.z = arg;
            }else if(arg[0] !== undefined){
                self.x = arg[0] || 0;
                self.y = arg[1] || 0;
                self.z = arg[2] || 0;
            }else{
            	self.x = arg.x || 0;
            	self.y = arg.y || 0;
            	self.z = arg.z || 0;
            }
        }else if (arguments.length === 3){
            self.x = arguments[0];
            self.y = arguments[1];
            self.z = arguments[2];
        }else{
            throw new Error("new V3(): wrong number of arguments:"+arguments.length);
        }
        return self;
    };

    V3.zero = new V3();
    V3.x    = new V3(1,0,0);
    V3.y    = new V3(0,1,0);
    V3.z    = new V3(0,0,1);

    var tmp  = new V3();
    var tmp1 = new V3();
    var tmp2 = new V3();

    var epsilon = 0.00000001;
    
    modula.V3 = V3;

    var proto = V3.prototype;

    V3.randomPositive = function(){
        return new V3(Math.random(), Math.random(), Math.random());
    };

    V3.random = function(){
        return new V3( Math.random()*2 - 1, 
                         Math.random()*2 - 1, 
                         Math.random()*2 - 1 );
    };

    V3.randomSphere = function(){
        var v = new V3();
        do{
            v.x = Math.random() * 2 - 1;
            v.y = Math.random() * 2 - 1;
            v.z = Math.random() * 2 - 1;
        }while(v.lenSq() > 1);
        return v;
    };

    V3.isZero  = function(v){
        return v.x === 0 && v.y === 0 && v.z === 0;
    };

    proto.isZero = function(){
        return V3.isZero(this);
    };
    
    V3.len  = function(v){
        return Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
    };

    proto.len = function(){
        return V3.len(this);
    };
    
    V3.lenSq = function(v){
        return v.x*v.x + v.y*v.y + v.z*v.z;
    };

    proto.lenSq = function(){
        return V3.lenSq(this);
    };

    V3.dist = function(u,v){
        var dx = u.x - v.x;
        var dy = u.y - v.y;
        var dz = u.z - v.z;
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    };
    
    proto.dist = function(v){
        return V3.dist(this,v);
    };

    V3.distSq = function(u,v){
        var dx = u.x - v.x;
        var dy = u.y - v.y;
        var dz = u.z - v.z;
        return dx*dx + dy*dy + dz*dz;
    };

    proto.distSq = function(v){
        return V3.distSq(this,v);
    };

    V3.dot = function(u,v){
        return u.x*v.x + u.y*v.y + u.z*v.z;
    };

    proto.dot = function(v){
        return V3.dot(this,v);
    };
    
    V3.angle = function(u,v){
        return math.acos(V3.dot(u,v)/(V3.len(u)*V3.len(v)));
    };

    proto.angle = function(v){
        return V3.angle(this,v);
    };

    V3.set = function(vd,vx,vy,vz){
        vd.x = vx;
        vd.y = vy;
        vd.z = vz;
        return vd;
    };

    V3.setArray = function(vd,array,offset){
        offset = offset || 0;
        vd.x = array[offset];
        vd.y = array[offset + 1];
        vd.z = array[offset + 2];
        return vd;
    };

    V3.copy = function(vd,v){
        vd.x = v.x;
        vd.y = v.y;
        vd.z = v.z;
        return vd;
    };

    proto.clone = function(){
        var vd = new V3();
        V3.copy(vd,this);
        return vd;
    };

    V3.add = function(vd,v){
        vd.x += v.x;
        vd.y += v.y;
        vd.z += v.z;
        return vd;
    };

    proto.add = function(v){
        return new V3(this.x + v.x, this.y + v.y, this.z + v.z);
    };

    V3.sub = function(vd,v){
        vd.x -= v.x;
        vd.y -= v.y;
        vd.z -= v.z;
        return vd;
    };

    proto.sub = function(v){
        return new V3(this.x - v.x, this.y - v.y, this.z - v.z);
    };

    V3.mult = function(vd,v){
        vd.x *= v.x;
        vd.y *= v.y;
        vd.z *= v.z;
        return vd;
    };

    proto.mult = function(v){
        return new V3(this.x * v.x, this.y * v.y, this.z * v.z);
    };

    V3.scale = function(vd,f){
        vd.x *= f;
        vd.y *= f;
        vd.z *= f;
        return vd;
    };

    proto.scale = function(f){
        return new V3(this.x * f, this.y * f, this.z * f);
    };

    V3.neg = function(vd){
        vd.x = -vd.x;
        vd.y = -vd.y;
        vd.z = -vd.z;
        return vd;
    };

    proto.neg = function(){
        return new V3(-this.x, - this.y, - this.z);
    };

    V3.div = function(vd,v){
        vd.x = vd.x/v.x;
        vd.y = vd.y/v.y;
        vd.z = vd.z/v.z;
        return vd;
    };
    
    proto.div = function(v){
        return new V3(this.x/v.x, this.y/v.y, this.z/v.z);
    };

    V3.invert = function(vd){
        vd.x = 1.0/vd.x;
        vd.y = 1.0/vd.y;
        vd.z = 1.0/vd.z;
        return vd;
    };

    proto.invert = function(){
        return new V3(1.0/this.x, 1.0/this.y, 1.0/this.z);
    };

    V3.pow = function(vd,pow){
        vd.x = Math.pow(vd.x,pow);
        vd.y = Math.pow(vd.y,pow);
        vd.z = Math.pow(vd.z,pow);
        return vd;
    };

    proto.pow = function(pow){
        return new V3( Math.pow(this.x,pow),
                       Math.pow(this.y,pow), 
                       Math.pow(this.z,pow) );
    };

    V3.sq = function(vd){
        vd.x = vd.x * vd.x;
        vd.y = vd.y * vd.y;
        vd.z = vd.z * vd.z;
        return vd;
    };

    proto.sq = function(){
        return new V3( this.x * this.x,
                       this.y * this.y,
                       this.z * this.z );
    };

    V3.normalize = function(vd){
        var len = V3.lenSq(vd);
        if(len === 0){
            vd.x = 1;
            vd.y = 0;
            vd.z = 0;
        }else if(len !== 1){
            len = 1 / Math.sqrt(len);
            vd.x = vd.x * len;
            vd.y = vd.y * len;
            vd.z = vd.z * len;
        }
        return vd;
    };

    proto.normalize = function(){
        var vd   = new V3();
        V3.copy(vd,this);
        V3.normalize(vd);
        return vd;
    };
    
    V3.setLen = function(vd,l){
        V3.normalize(vd);
        V3.scale(vd,l);
        return vd;
    };

    proto.setLen = function(l){
        var vd = new V3();
        V3.copy(vd,this);
        V3.setLen(vd,l);
        return vd;
    };

    V3.project = function(vd,v){
        V3.copy(tmp,v);
        V3.normalize(tmp);
        var dot = V3.dot(vd,tmp);
        V3.copy(vd,tmp);
        V3.setLen(vd,dot);
        return vd;
    };

    proto.project = function(v){
        var vd = new V3();
        V3.copy(vd,this);
        V3.project(vd,v);
        return vd;
    };

    proto.toString = function(){
        var str = "[";
        str += this.x ;
        str += "," ;
        str += this.y ;
        str += "," ;
        str += this.z ;
        str += "]" ;
        return str;
    };

    V3.lerp = function(vd,v,f){
        var nf = 1.0 - f;
        vd.x = vd.x*nf + v.x*f;
        vd.y = vd.y*nf + v.y*f;
        vd.z = vd.z*nf + v.z*f;
        return vd;
    };

    proto.lerp = function(v,f){
        var nf = 1.0 - f;
        return new V3( this.x*nf + v.x*f,
                       this.y*nf + v.y*f,
                       this.z*nf + v.z*f );

    };

    V3.equals  = function(u,v){
        return Math.abs(u.x - v.x) <= epsilon &&
               Math.abs(u.y - v.y) <= epsilon &&
               Math.abs(u.z - v.z) <= epsilon;
    };

    proto.equals = function(v){
        return V3.equals(this,v);
    };
    
    V3.round  = function(vd){
        vd.x = Math.round(vd.x);
        vd.y = Math.round(vd.y);
        vd.z = Math.round(vd.z);
        return vd;
    };

    proto.round = function(){
        return new V3( Math.round(this.x),
                       Math.round(this.y), 
                       Math.round(this.z) );
    };

    V3.reflect = function(vd,vn){
        V3.copy(tmp,vn);
        V3.normalize(tmp);
        var dot2 = V3.dot(vd,tmp) * 2;
        vd.x = vd.x - tmp.x * dot2;
        vd.y = vd.y - tmp.y * dot2;
        vd.z = vd.z - tmp.z * dot2;
        return vd;
    };

    proto.reflect = function(vn){
        var vd = new V3();
        V3.copy(vd,this);
        V3.reflect(vd,vn);
        return vd;
    };

    V3.cross  = function(vd,v){
        var vdx = vd.x, vdy = vd.y, vdz = vd.z;
        vd.x = vdy*v.z - vdz*v.y;
        vd.y = vdz*v.x - vdx*v.z;
        vd.z = vdx*v.y - vdy*v.x;
        return vd;
    }

    proto.cross = function(v){
        return new V3( this.y*v.z - this.z*v.y,
                       this.z*v.x - this.x*v.z,
                       this.x*v.y - this.y*v.x );
    };

    proto.i       = function(i){
        if(i === 0){
            return this.x;
        }else if(i === 1){
            return this.y;
        }else if(i === 2){
            return this.z;
        }else{
            return 0.0;
        }
    };
    
    V3.toArray = function(array,v,offset){
        offset = offset || 0;
        array[offset]     = v.x;
        array[offset + 1] = v.y;
        array[offset + 2] = v.z;
        return array;
    };

    proto.array   = function(){
        return [this.x,this.y,this.z];
    };

    proto.float32 = function(){
        var a = new Float32Array(3);
        a[0] = this.x;
        a[1] = this.y;
        a[2] = this.z;
        return a;
    };

})(typeof exports === 'undefined' ? ( this['modula'] || (this['modula'] = {})) : exports );
