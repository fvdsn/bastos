
(function(modula){

    function Rect(minX,minY,sizeX,sizeY,opts){
        opts = opts || {};
        this.sizeX = sizeX;              
        this.sizeY = sizeY;              
        this.halfSizeX = sizeX/2;        
        this.halfSizeY = sizeY/2;        
        this.minX  = minX;                
        this.minY  = minY;               
        this.x = minX + this.halfSizeX;   
        this.y = minY + this.halfSizeY;   
        this.maxX = this.minX + sizeX;  
        this.maxY = this.minY + sizeY;  
        if(opts.centered){
            this.x = this.minX;
            this.minX    -= this.halfSizeX;
            this.maxX    -= this.halfSizeX;
            this.y = this.minY;
            this.minY    -= this.halfSizeY;
            this.maxY    -= this.halfSizeY;
        }
    }

    modula.Rect = Rect;

    var proto = Rect.prototype;

    proto.containsPos = function(x,y){
        return x >= this.minX && x < this.maxX && y >= this.minY && y < this.maxY;
    };

    proto.containsRect = function(rect){
        return rect.minX >= this.minX && rect.maxX <= this.maxX && rect.minY >= this.minY && rect.maxY <= this.maxY;
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


    proto.collidesRectNormal = function(rect){
        var dx = boundEscapeDist(this.minX, this.maxX, rect.minX, rect.maxX);
        if(!dx){
            return undefined;
        }
        var dy = boundEscapeDist(this.minY, this.maxY, rect.minY, rect.maxY);
        if (dy){
            if ( Math.abs(dx) < Math.abs(dy)){
                return {x:dx, y:0};
            }else{
                return {x:0, y:dy};
            }
        }else{
            return undefined;
        }
    };

    proto.collidesRect = function(rect){
        var dx = boundEscapeDist(this.minX, this.maxX, rect.minX, rect.maxX);
        if(!dx){
            return undefined;
        }
        var dy = boundEscapeDist(this.minY, this.maxY, rect.minY, rect.maxY);
        if(dy){
            return {x:dx, y:dy};
        }else{
            return undefined;
        }
    };


    proto.collidesRay = function(startX, startY, dirX, dirY){
    };

    proto.collidesHalfPlane = function(ax,ay, bx,by){
    }; 

    function Circle(x,y,radius){
        this.x = x;
        this.y = y;
        this.radius = radius;
    }

})(typeof exports === 'undefined' ? ( this['modula'] || this['modula'] = {}) : exports );
