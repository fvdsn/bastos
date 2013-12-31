

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





