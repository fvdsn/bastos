
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

