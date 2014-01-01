
/* ------ Input Handling ----- */

(function(modula){

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

            for(key in this.status){
                var previous = this.status[key] || 'up';
                this.status[key] = transition[previous];
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
                var previous = this.status[e.key] || 'up';
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
})(typeof exports === 'undefined' ? ( this['modula'] || (this['modula'] = {})) : exports );
