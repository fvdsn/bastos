
/* ----- 4x4 Matrix for 3D Transforms ----- */

(function(modula){

    var V3 = modula.V3 || (typeof 'require' !== 'undefined' ? require('V3').V3 : null);

    if(!V3 ){
        throw new Error('modula.Mat4 requires modula.V3');
    }

    var setArray = function(md,array,offset){

        // 0 4 8  12 | xx xy xz xw
        // 1 5 9  13 | yx yy yz yw
        // 2 6 10 14 | zx zy zz zw
        // 3 7 11 15 | wx wy wz ww
        
        md.xx = array[0];
        md.yx = array[1];
        md.zx = array[2];
        md.wx = array[3];
        
        md.xy = array[4];
        md.yy = array[5];
        md.zy = array[6];
        md.wy = array[7];
        
        md.xz = array[8];
        md.yz = array[9];
        md.zz = array[10];
        md.wz = array[11];
        
        md.xw = array[12];
        md.yw = array[13];
        md.zw = array[14];
        md.ww = array[15];
        return md;
    };

    var set = function(md,components_){
        setArray(md,arguments,1);
        return md;
    };

    function Mat4(arg){
        var self = this;
        if(this.constructor !== Mat4){
            self = new Mat4();
        }
        var alen = arguments.length;
        if(alen === 0){
            self.xx = 1;
            self.xy = 0;
            self.xz = 0;
            self.xw = 0;
            self.yx = 0;
            self.yy = 1;
            self.yz = 0;
            self.yw = 0;
            self.zx = 0;
            self.zy = 0;
            self.zz = 1;
            self.zw = 0;
            self.wx = 0;
            self.wy = 0;
            self.wz = 0;
            self.ww = 1;
        }else if(alen === 1){
            if(typeof arg === 'string'){
                arg = JSON.parse(arg);
            }
            if(arg[0] !== undefined){
                setArray(self,arg);
            }else{
                Mat4.copy(self,arg);
            }
        }else if(alen === 16){
            setArray(self,arguments);
        }else{
            throw new Error("wrong number of arguments:"+alen);
        }
        return self;
    };

    var tmp   = new Mat4();

    modula.Mat4 = Mat4;

    Mat4.id       = new Mat4();
    Mat4.zero     = new Mat4(0,0,0,0,
                             0,0,0,0,
                             0,0,0,0,
                             0,0,0,0);

    var proto = Mat4.prototype;

    var epsilon  = 0.00000001;    

    function epsilonEquals(a,b){  return Math.abs(a-b) <= epsilon };

    Mat4.equals  = function(m,n){
        return epsilonEquals(m.xx, n.xx) &&
               epsilonEquals(m.xy, n.xy) &&
               epsilonEquals(m.xz, n.xz) &&
               epsilonEquals(m.xw, n.xw) &&
               epsilonEquals(m.yx, n.yx) &&
               epsilonEquals(m.yy, n.yy) &&
               epsilonEquals(m.yz, n.yz) &&
               epsilonEquals(m.yw, n.yw) &&
               epsilonEquals(m.zx, n.zx) &&
               epsilonEquals(m.zy, n.zy) &&
               epsilonEquals(m.zz, n.zz) &&
               epsilonEquals(m.zw, n.zw) &&
               epsilonEquals(m.wx, n.wx) &&
               epsilonEquals(m.wy, n.wy) &&
               epsilonEquals(m.wz, n.wz) &&
               epsilonEquals(m.ww, n.ww);
    };
        
    proto.equals = function(mat){
        return Mat4.equals(this,mat);
    };

    Mat4.set  = set;

    Mat4.setArray  = setArray;

    Mat4.copy = function(md,m){
        md.xx = m.xx;
        md.xy = m.xy;
        md.xz = m.xz;
        md.xw = m.xw;
        
        md.yx = m.yx;
        md.yy = m.yy;
        md.yz = m.yz;
        md.yw = m.yw;
        
        md.zx = m.zx;
        md.zy = m.zy;
        md.zz = m.zz;
        md.zw = m.zw;
        
        md.wx = m.wx;
        md.wy = m.wy;
        md.wz = m.wz;
        md.ww = m.ww;
        return md;
    };

    proto.clone = function(){
        var md = new Mat4();
        Mat4.copy(md,this);
        return md;
    };

    proto.toString = function(){
        var str = "[";
        str += this.xx + ",";
        str += this.xy + ",";
        str += this.xz + ",";
        str += this.xw + ",\n ";
        str += this.yx + ",";
        str += this.yy + ",";
        str += this.yz + ",";
        str += this.yw + ",\n ";
        str += this.zx + ",";
        str += this.zy + ",";
        str += this.zz + ",";
        str += this.zw + ",\n ";
        str += this.wx + ",";
        str += this.wy + ",";
        str += this.wz + ",";
        str += this.ww + "]";
        return str;
    };

    Mat4.add = function(md,m){
        md.xx += m.xx;
        md.xy += m.xy;
        md.xz += m.xz;
        md.xw += m.xw;
        md.yx += m.yx;
        md.yy += m.yy;
        md.yz += m.yz;
        md.yw += m.yw;
        md.zx += m.zx;
        md.zy += m.zy;
        md.zz += m.zz;
        md.zw += m.zw;
        md.wx += m.wx;
        md.wy += m.wy;
        md.wz += m.wz;
        md.ww += m.ww;
        return md;
    };

    proto.add = function(mat){
        var md = new Mat4();
        Mat4.copy(md,this);
        Mat4.add(md,mat);
        return md;
    };

    Mat4.sub = function(md,m){
        md.xx -= m.xx;
        md.xy -= m.xy;
        md.xz -= m.xz;
        md.xw -= m.xw;
        md.yx -= m.yx;
        md.yy -= m.yy;
        md.yz -= m.yz;
        md.yw -= m.yw;
        md.zx -= m.zx;
        md.zy -= m.zy;
        md.zz -= m.zz;
        md.zw -= m.zw;
        md.wx -= m.wx;
        md.wy -= m.wy;
        md.wz -= m.wz;
        md.ww -= m.ww;
        return md;
    };

    proto.sub = function(mat){
        var md = new Mat4();
        Mat4.copy(md,this);
        Mat4.sub(md,mat);
        return md;
    };

    Mat4.neg = function(md){
        md.xx = -md.xx;
        md.xy = -md.xy;
        md.xz = -md.xz;
        md.xw = -md.xw;
        md.yx = -md.yx;
        md.yy = -md.yy;
        md.yz = -md.yz;
        md.yw = -md.yw;
        md.zx = -md.zx;
        md.zy = -md.zy;
        md.zz = -md.zz;
        md.zw = -md.zw;
        md.wx = -md.wx;
        md.wy = -md.wy;
        md.wz = -md.wz;
        md.ww = -md.ww;
        return md;
    };

    proto.neg = function(){
        var md = new Mat4();
        Mat4.copy(md,this);
        Mat4.neg(md);
        return md;
    };

    Mat4.tr = function(md){
        var m = Mat4.copy(tmp,md);
        md.xx = m.xx;
        md.xy = m.yx;
        md.xz = m.zx;
        md.xw = m.wx;
        md.yx = m.xy;
        md.yy = m.yy;
        md.yz = m.zy;
        md.yw = m.wy;
        md.zx = m.xz;
        md.zy = m.yz;
        md.zz = m.zz;
        md.zw = m.wz;
        md.wx = m.xw;
        md.wy = m.yw;
        md.wz = m.zw;
        md.ww = m.ww;
        return md;
    };

    proto.tr = function(){
        var md = new Mat4();
        Mat4.copy(md,this);
        Mat4.tr(md);
        return md;
    };
    
    Mat4.mult = function(md,m){
        var b = Mat4.copy(tmp,md);
        var a = m;
        if(md === m){
            a = b;
        }
		md.xx = a.xx * b.xx + a.xy * b.yx + a.xz * b.zx + a.xw * b.wx;
		md.xy = a.xx * b.xy + a.xy * b.yy + a.xz * b.zy + a.xw * b.wy;
		md.xz = a.xx * b.xz + a.xy * b.yz + a.xz * b.zz + a.xw * b.wz;
		md.xw = a.xx * b.xw + a.xy * b.yw + a.xz * b.zw + a.xw * b.ww;

		md.yx = a.yx * b.xx + a.yy * b.yx + a.yz * b.zx + a.yw * b.wx;
		md.yy = a.yx * b.xy + a.yy * b.yy + a.yz * b.zy + a.yw * b.wy;
		md.yz = a.yx * b.xz + a.yy * b.yz + a.yz * b.zz + a.yw * b.wz;
		md.yw = a.yx * b.xw + a.yy * b.yw + a.yz * b.zw + a.yw * b.ww;

		md.zx = a.zx * b.xx + a.zy * b.yx + a.zz * b.zx + a.zw * b.wx;
		md.zy = a.zx * b.xy + a.zy * b.yy + a.zz * b.zy + a.zw * b.wy;
		md.zz = a.zx * b.xz + a.zy * b.yz + a.zz * b.zz + a.zw * b.wz;
		md.zw = a.zx * b.xw + a.zy * b.yw + a.zz * b.zw + a.zw * b.ww;

		md.wx = a.wx * b.xx + a.wy * b.yx + a.wz * b.zx + a.ww * b.wx;
		md.wy = a.wx * b.xy + a.wy * b.yy + a.wz * b.zy + a.ww * b.wy;
		md.wz = a.wx * b.xz + a.wy * b.yz + a.wz * b.zz + a.ww * b.wz;
		md.ww = a.wx * b.xw + a.wy * b.yw + a.wz * b.zw + a.ww * b.ww;
        return md;
    };

    Mat4.multFac  = function(md,fac){
        md.xx *= fac;
        md.xy *= fac;
        md.xz *= fac;
        md.xw *= fac;
        md.yx *= fac;
        md.yy *= fac;
        md.yz *= fac;
        md.yw *= fac;
        md.zx *= fac;
        md.zy *= fac;
        md.zz *= fac;
        md.zw *= fac;
        md.wx *= fac;
        md.wy *= fac;
        md.wz *= fac;
        md.ww *= fac;
        return md;
    };

    Mat4.multV3 = function(vd,m){
        var vx = vd.x, vy = vd.y, vz = vd.z;
        var  d = 1.0 / ( m.wx * vx + m.wy * vy + m.wz * vz + m.ww);
        vd.x = ( m.xx * vx + m.xy * vy + m.xz * vz + m.xw  ) * d;
        vd.y = ( m.yx * vx + m.yy * vy + m.yz * vz + m.yw  ) * d;
        vd.z = ( m.zx * vx + m.zy * vy + m.zz * vz + m.zw  ) * d;
        return vd;
    };

    proto.mult = function(arg){
        if(typeof arg === 'number'){
            var md = new Mat4();
            Mat4.copy(md,this);
            Mat4.multFac(md,arg);
            return md;
        }else if(arg instanceof Mat4){
            var md = new Mat4();
            Mat4.copy(md,this);
            Mat4.mult(md,arg);
            return md;
        }else if(arg instanceof V3){
            var vd = new V3();
            V3.copy(vd,arg);
            Mat4.multV3(vd,this);
            return vd;
        }else{
            throw new Error('cannot multiply Mat4 with object of type:',typeof(arg));
        }
    };

    Mat4.det = function(m){
		return (
			m.xw * m.yz * m.zy * m.wx-
			m.xz * m.yw * m.zy * m.wx-
			m.xw * m.yy * m.zz * m.wx+
			m.xy * m.yw * m.zz * m.wx+

			m.xz * m.yy * m.zw * m.wx-
			m.xy * m.yz * m.zw * m.wx-
			m.xw * m.yz * m.zx * m.wy+
			m.xz * m.yw * m.zx * m.wy+

			m.xw * m.yx * m.zz * m.wy-
			m.xx * m.yw * m.zz * m.wy-
			m.xz * m.yx * m.zw * m.wy+
			m.xx * m.yz * m.zw * m.wy+

			m.xw * m.yy * m.zx * m.wz-
			m.xy * m.yw * m.zx * m.wz-
			m.xw * m.yx * m.zy * m.wz+
			m.xx * m.yw * m.zy * m.wz+

			m.xy * m.yx * m.zw * m.wz-
			m.xx * m.yy * m.zw * m.wz-
			m.xz * m.yy * m.zx * m.ww+
			m.xy * m.yz * m.zx * m.ww+

			m.xz * m.yx * m.zy * m.ww-
			m.xx * m.yz * m.zy * m.ww-
			m.xy * m.yx * m.zz * m.ww+
			m.xx * m.yy * m.zz * m.ww
		);
    };

    proto.det = function(){
        return Mat4.det(this);
    }

    Mat4.invert  = function(md){
        var det = Mat4.det(md);
        var m   = Mat4.copy(tmp,md);

        det = 1 / det;
		md.xx = ( m.yz*m.zw*m.wy - m.yw*m.zz*m.wy + m.yw*m.zy*m.wz - m.yy*m.zw*m.wz - m.yz*m.zy*m.ww + m.yy*m.zz*m.ww ) * det;
		md.xy = ( m.xw*m.zz*m.wy - m.xz*m.zw*m.wy - m.xw*m.zy*m.wz + m.xy*m.zw*m.wz + m.xz*m.zy*m.ww - m.xy*m.zz*m.ww ) * det;
		md.xz = ( m.xz*m.yw*m.wy - m.xw*m.yz*m.wy + m.xw*m.yy*m.wz - m.xy*m.yw*m.wz - m.xz*m.yy*m.ww + m.xy*m.yz*m.ww ) * det;
		md.xw = ( m.xw*m.yz*m.zy - m.xz*m.yw*m.zy - m.xw*m.yy*m.zz + m.xy*m.yw*m.zz + m.xz*m.yy*m.zw - m.xy*m.yz*m.zw ) * det;
		md.yx = ( m.yw*m.zz*m.wx - m.yz*m.zw*m.wx - m.yw*m.zx*m.wz + m.yx*m.zw*m.wz + m.yz*m.zx*m.ww - m.yx*m.zz*m.ww ) * det;
		md.yy = ( m.xz*m.zw*m.wx - m.xw*m.zz*m.wx + m.xw*m.zx*m.wz - m.xx*m.zw*m.wz - m.xz*m.zx*m.ww + m.xx*m.zz*m.ww ) * det;
		md.yz = ( m.xw*m.yz*m.wx - m.xz*m.yw*m.wx - m.xw*m.yx*m.wz + m.xx*m.yw*m.wz + m.xz*m.yx*m.ww - m.xx*m.yz*m.ww ) * det;
		md.yw = ( m.xz*m.yw*m.zx - m.xw*m.yz*m.zx + m.xw*m.yx*m.zz - m.xx*m.yw*m.zz - m.xz*m.yx*m.zw + m.xx*m.yz*m.zw ) * det;
		md.zx = ( m.yy*m.zw*m.wx - m.yw*m.zy*m.wx + m.yw*m.zx*m.wy - m.yx*m.zw*m.wy - m.yy*m.zx*m.ww + m.yx*m.zy*m.ww ) * det;
		md.zy = ( m.xw*m.zy*m.wx - m.xy*m.zw*m.wx - m.xw*m.zx*m.wy + m.xx*m.zw*m.wy + m.xy*m.zx*m.ww - m.xx*m.zy*m.ww ) * det;
		md.zz = ( m.xy*m.yw*m.wx - m.xw*m.yy*m.wx + m.xw*m.yx*m.wy - m.xx*m.yw*m.wy - m.xy*m.yx*m.ww + m.xx*m.yy*m.ww ) * det;
		md.zw = ( m.xw*m.yy*m.zx - m.xy*m.yw*m.zx - m.xw*m.yx*m.zy + m.xx*m.yw*m.zy + m.xy*m.yx*m.zw - m.xx*m.yy*m.zw ) * det;
		md.wx = ( m.yz*m.zy*m.wx - m.yy*m.zz*m.wx - m.yz*m.zx*m.wy + m.yx*m.zz*m.wy + m.yy*m.zx*m.wz - m.yx*m.zy*m.wz ) * det;
		md.wy = ( m.xy*m.zz*m.wx - m.xz*m.zy*m.wx + m.xz*m.zx*m.wy - m.xx*m.zz*m.wy - m.xy*m.zx*m.wz + m.xx*m.zy*m.wz ) * det;
		md.wz = ( m.xz*m.yy*m.wx - m.xy*m.yz*m.wx - m.xz*m.yx*m.wy + m.xx*m.yz*m.wy + m.xy*m.yx*m.wz - m.xx*m.yy*m.wz ) * det;
		md.ww = ( m.xy*m.yz*m.zx - m.xz*m.yy*m.zx + m.xz*m.yx*m.zy - m.xx*m.yz*m.zy - m.xy*m.yx*m.zz + m.xx*m.yy*m.zz ) * det;
        return md;
    };

    proto.invert = function(){
        var md = new Mat4();
        Mat4.copy(md,this);
        Mat4.invert(md);
        return md;
    };

    var map = [ ['xx','xy','xz','xw'],
                ['yx','yy','yz','yw'],
                ['zx','zy','zz','zw'],
                ['wx','wy','wz','ww'] ];
    
    proto.ij = function(i,j){
        return this[ map[i][j] ];
    };

    Mat4.setId = function(md){
        md.xx = 1;
        md.xy = 0;
        md.xz = 0;
        md.xw = 0;
        md.yx = 0;
        md.yy = 1;
        md.yz = 0;
        md.yw = 0;
        md.zx = 0;
        md.zy = 0;
        md.zz = 1;
        md.zw = 0;
        md.wx = 0;
        md.wy = 0;
        md.wz = 0;
        md.ww = 1;
        return md;
    };

    Mat4.setRotateX = function(md,angle){
        Mat4.setId(md);
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        md.yy = c;
        md.yz = -s;
        md.zy = s;
        md.zz = c;
        return md;
    };

    Mat4.rotateX = function(angle){
        var md = new Mat4();
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        md.yy = c;
        md.yz = -s;
        md.zy = s;
        md.zz = c;
        return md;

    };
    Mat4.setRotateY = function(md,angle){
        Mat4.setId(md);
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        md.xx = c;
        md.xz = s;
        md.zx = -s;
        md.zz = c;
        return md;
    };
    Mat4.rotateY = function(angle){
        var md = new Mat4();
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        md.xx = c;
        md.xz = s;
        md.zx = -s;
        md.zz = c;
        return md;
    };
    Mat4.setRotateZ = function(md,angle){
        Mat4.setId(md);
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        md.xx = c;
        md.xy = -s;
        md.yx = s;
        md.yy = c;
        return md;
    };

    Mat4.rotateZ = function(angle){
        var md = new Mat4();
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        md.xx = c;
        md.xy = -s;
        md.yx = s;
        md.yy = c;
        return md;
    };

    Mat4.setRotateEuler  = function(md,X,Y,Z){
        Mat4.setRotateZ(md,Z);
        Mat4.setRotateY(tmp,Y);
        Mat4.mult(md,tmp);
        Mat4.setRotateX(tmp,X);
        Mat4.mult(md,tmp);
        return md;
    };
    
    Mat4.rotateEuler = function(X,Y,Z){
        var md = new Mat4();
        Mat4.setRotateEuler(md,X,Y,Z);
        return md;
    };
    
    Mat4.getEulerAngles = function(vd,m){
        vd.x = Math.atan2(m.zy,mzz);
        vd.y = Math.atan2(-m.zx,Math.sqrt(m.zy*m.zy+m.zz*m.zz));
        vd.z = Math.atan2(m.yx,m.xx);
        return vd;
    };
    
    proto.getEulerAngles = function(){
        var vd = new V3();
        Mat4.getEulerAngles(vd,this);
        return vd;
    };

    Mat4.setRotateAxis  = function(md,vec,angle){
        Mat4.setId(md);
        var u = vec;
        var c = Math.cos(angle);
        var nc = (1-c);
        var s = Math.sin(angle);

        md.xx = c + u.x*u.x*nc;
        md.xy = u.x*u.y*nc - u.z*s;
        md.xz = u.x*u.z*nc + u.y*s;
        
        md.yx = u.y*u.x*nc + u.z*s;
        md.yy = c + u.y*u.y*nc;
        md.yz = u.y*u.z*nc - u.x*s;

        md.zx = u.z*u.x*nc - u.y*s;
        md.zy = u.z*u.y*nc + u.x*s;
        md.zz = c + u.z*u.z*nc;
        return md;
    };

    Mat4.rotateAxis = function(vec,angle){
        var md = new Mat4();
        Mat4.setRotateAxis(md,vec,angle);
        return md;
    };
    
    Mat4.setRotateQuat = function(md,q){
        Mat4.setId(md);
        var x = q.x, y = q.y, z = q.z, w = q.w;
        md.xx = 1 - 2*y*y - 2*z*z;
        md.xy = 2*x*y - 2*w*z;
        md.xz = 2*x*z + 2*w*y;
        md.yx = 2*x*y + 2*w*z;
        md.yy = 1 - 2*x*x - 2*z*z;
        md.yz = 2*y*z + 2*w*x;
        md.zx = 2*x*z - 2*w*y;
        md.zy = 2*y*z - 2*w*x;
        md.zz = 1 - 2*x*x - 2*y*y;
        return md;
    };

    Mat4.rotateQuat = function(q){
        var md = new Mat4();
        Mat4.setRotateQuat(md,q);
        return md;
    };

    Mat4.setScale   = function(md,sv){
        Mat4.setId(md);
        md.xx = sv.x;
        md.yy = sv.y;
        md.zz = sv.z;
        return md;
    };
    Mat4.scale    = function(sv){
        var m = new Mat4();
        m.xx = sv.x;
        m.yy = sv.y;
        m.zz = sv.z;
        return m;
    };
    Mat4.setTranslate = function(md,v){
        Mat4.setId(md);
        md.xw = v.x;
        md.yw = v.y;
        md.zw = v.z;
        return md;
    };

    Mat4.translate = function(v){
        var m = new Mat4();
        Mat4.setTranslate(m,v);
        return m;
    };

    Mat4.setSkewXY = function(md,sx,sy){
        Mat4.setId(md);
        md.xz = sx;
        md.yz = sy;
        return md;
    };

    Mat4.shearXY  = function(sx,sy){
        var md = new Mat4();
        Mat4.setSkewXY(md,sx,sy);
        return md;
    };

    Mat4.setSkewYZ = function(md,sy,sz){
        Mat4.setId(md);
        md.yx = sy;
        md.zx = sz;
        return md;
    };

    Mat4.shearYZ  = function(sy,sz){
        var md = new Mat4();
        Mat4.setSkewYZ(md,sy,sz);
        return md;
    };

    Mat4.setSkewXZ = function(md,sx,sz){
        Mat4.setId(md);
        md.xy = sx;
        md.zy = sz;
        return md;
    };

    Mat4.shearXZ = function(sx,sz){
        var md = new Mat4();
        Mat4.setSkewXZ(md,sx,sz);
        return md;
    };

    Mat4.setOrtho = function(md,left,right,bottom,top,near,far){
        Mat4.setId(md);
        md.xx = 2 / ( right - left);
        md.yy = 2 / ( top - bottom);
        md.zz = - 2 / ( far - near );  //FIXME wikipedia says this must be negative ?
        md.xw = - ( right + left ) / ( right - left );
        md.yw = - ( top + button ) / ( top - bottom );
        md.zw = - ( far + near ) / ( far - near );
        return md;
    };

    Mat4.ortho = function(l,r,b,t,n,f){
        var md = new Mat4();
        Mat4.setOrtho(md,l,r,b,t,n,f);
        return md;
    };

    Mat4.setFrustrum = function(md,l,r,b,t,n,f){
        Mat4.setId(md);
        md.xx = 2*n / (r-l);
        md.yy = 2*n / (t-b);
        md.zz = -(f+n)/(f-n);
        md.xz = (r+l) / (r-l);
        md.yz = (t+b) / (t-b);
        md.wz = -1;
        md.zw = -2*f*n/(f-n);
    };
    
    Mat4.frustrum = function(l,r,b,t,n,f){
        var md = new Mat4();
        Mat4.setFrustrum(md);
        return md;
    };

    Mat4.setLookAt = function(){
    };

    proto.getScale = function(){
    };

    proto.getRotate = function(){};
    proto.getTranslate = function(){
        return new V3(this.xw,this.yw,this.zw);
    };

    Mat4.toArray = function(array,m,offset){
        offset = offset || 0;

        // 0 4 8  12 | xx xy xz xw
        // 1 5 9  13 | yx yy yz yw
        // 2 6 10 14 | zx zy zz zw
        // 3 7 11 15 | wx wy wz ww

        array[0 +offset] = m.xx;
        array[1 +offset] = m.yx;
        array[2 +offset] = m.zx;
        array[3 +offset] = m.wx;
        array[4 +offset] = m.xy;
        array[5 +offset] = m.yy;
        array[6 +offset] = m.zy;
        array[7 +offset] = m.wy;
        array[8 +offset] = m.xz;
        array[9 +offset] = m.yz;
        array[10+offset] = m.zz;
        array[11+offset] = m.wz;
        array[12+offset] = m.xw;
        array[13+offset] = m.yw;
        array[14+offset] = m.zw;
        array[15+offset] = m.ww;
        return array;
    };

    proto.array = function(){
        return Mat4.toArray([],this);
    };

    proto.float32 = function(){
        return Mat4.toArray(new Float32Array(16),this);
    };

})(typeof exports === 'undefined' ? ( this['modula'] || (this['modula'] = {})) : exports );
