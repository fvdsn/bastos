
/* ----- Quaternions ----- */

(function(modula){

    function setArray(qd,array,offset){
        offset = offset || 0;
        qd.x = array[offset];
        qd.y = array[offset + 1];
        qd.z = array[offset + 2];
        qd.w = array[offset + 3];
        return qd;
    }
    
    function set(qd,components_){
        setArray(qd,arguments,1);
        return qd;
    }

    function Quat(arg){
        var self = this;
        if(this.constructor !== Quat){
            self = new Quat();
        }
    	var alen = arguments.length;      
    	if(alen === 0){
            self.x = 0.0;
            self.y = 0.0;
            self.z = 0.0;
            self.w = 1.0;
        }else if (alen === 1){
        	if  (typeof arg === 'string'){
        		arg = JSON.parse(arg);
        	}
            if(arg[0] !== undefined){
                setArray(self,arg);
            }else{
                Quat.copy(self,arg);
            }
        }else if (alen === 4){
            setArray(self,arguments);
        }else{
            throw new Error("wrong number of arguments:"+arguments.length);
        }
        return self;
    }

    modula.Quat = Quat;

    var tmp = new Quat();
    
    var proto = Quat.prototype;

    Quat.id   = new Quat();

    Quat.set = set;
    
    Quat.setArray = setArray;
    
    Quat.copy = function(qd,q){
        qd.x = q.x;
        qd.y = q.y;
        qd.z = q.z;
        qd.w = q.w;
        return qd;
    };

    proto.clone = function(){
        var qd = new Quat();
        Quat.copy(qd,this);
        return qd;
    };

    proto.toString = function(){
        var str = "[";
        str += this.x ;
        str += "," ;
        str += this.y ;
        str += "," ;
        str += this.z ;
        str += "," ;
        str += this.w ;
        str += "]" ;
        return str;
    };

    Quat.mult = function(qd,q){
        var a = Quat.copy(tmp,qd);
        var b = q;
        if(qd == q){
            b = a;
        }
        qd.w = a.w*b.w - a.x*b.x - a.y*b.y - a.z*b.z;
        qd.x = a.w*b.x + a.x*b.w + a.y*b.z - a.z*b.y;
        qd.y = a.w*b.y - a.x*b.z + a.y*b.w + a.z*b.x;
        qd.z = a.w*b.z + a.x*b.y - a.y*b.x + a.z*b.w;
        return qd;
    };


    proto.mult = function(q){
        var qd = new Quat();
        Quat.copy(qd,this);
        Quat.mult(qd,q);
        return qd;
    };

    Quat.neg = function(qd){
        qd.x = -qd.x;
        qd.y = -qd.y;
        qd.z = -qd.z;
        qd.w =  qd.w;
        return qd;
    };

    proto.neg = function(){
        return new Quat( -this.x, 
                         -this.y,
                         -this.z,
                          this.w );
    };


    Quat.lerp = function(qd,r,t){
        var qx = qd.x, qy = qd.y, qz = qd.z, qw = qd.w;
        var rx = r.x, ry = r.y, rz = r.z, rw = r.w;
        var it = 1 - t;
        qd.x = it*qx + it*rx;
        qd.y = it*qy + it*ry;
        qd.z = it*qz + it*rz;
        qd.w = it*qw + it*rw;
        Quat.normalize(qd);
        return qd;
    };

    proto.lerp = function(q,t){
        var qd = new Quat();
        Quat.copy(qd,this);
        Quat.lerp(qd,q,t);
        return qd;
    };
        

    proto.len = function(){
        return Math.sqrt(
                this.x*this.x + 
                this.y*this.y + 
                this.z*this.z + 
                this.w*this.w);
    };

    Quat.normalize = function(qd){
        var qx = qd.x, qy = qd.y, qz = qd.z, qw = qd.w;
        var ilen = 1.0 / Math.sqrt(qx*qx + qy*qy + qz*qz + qw*qw);
        qd.x = qx * ilen;
        qd.y = qy * ilen;
        qd.z = qz * ilen;
        qd.w = qw * ilen;
        return qd;
    };

    proto.normalize = function(){
        var qd = new Quat();
        Quat.copy(qd,this);
        Quat.normalize(qd);
        return qd;
    };

    Quat.setRotateAxis = function(qd,vec,angle){
        var s = Math.sin(angle*0.5);
        qd.w = Math.cos(angle*0.5);
        qd.x = vec.x * s;
        qd.y = vec.y * s;
        qd.z = vec.y * s;
        return qd;
    };

    Quat.setRotateX = function(qd,vec,angle){
        qd.w = Math.cos(angle*0.5);
        qd.x = Math.sin(angle*0.5);
        qd.y = 0;
        qd.z = 0;
        return qd;
    };

    Quat.setRotateY = function(qd,vec,angle){
        qd.w = Math.cos(angle*0.5);
        qd.x = 0;
        qd.y = Math.sin(angle*0.5);
        qd.z = 0;
        return qd;
    };

    Quat.setRotateZ = function(qd,vec,angle){
        qd.w = Math.cos(angle*0.5);
        qd.x = 0;
        qd.y = 0;
        qd.z = Math.sin(angle*0.5);
        return qd;
    };

    Quat.rotateAxis = function(vec,angle){
        var qd = new Quat();
        Quat.setRotateAxis(qd,vec,angle);
        return qd;
    };

    Quat.toArray = function(array,qd,offset){
        offset = offset || 0;
        array[offset + 0] = qd.x
        array[offset + 1] = qd.y
        array[offset + 2] = qd.z
        array[offset + 3] = qd.w
        return array;
    };

    Quat.array = function(){
        return Quat.toArray([],this);
    };

    //proto.float32 = function(){
    //    return Mat4.toArray(new Float32Array(4),this);
    //};

})(typeof exports === 'undefined' ? ( this['modula'] || (this['modula'] = {})) : exports );
