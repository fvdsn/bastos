
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
