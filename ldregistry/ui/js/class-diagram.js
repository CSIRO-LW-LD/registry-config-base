// Create UML class display from globals:
//       ClassDiagramClasses
//       ClassDiagramObjectProperties

// Class diagram library

var classDiagram = (function(){
    // Sizing constants
    var WIDTH = 150;
    var HEIGHT = 60;
    var SPACING = 50;
    var LABEL_WIDTH = 120;
    var LABEL_HEIGHT = 40;
    var ANON_WIDTH = 80;
    var ANON_HEIGHT = 40;

    // New shape types

    // Variant on uml.Class which omits the method block
    OwlClass = joint.shapes.basic.Generic.extend({

        markup: [
        '<g class="rotatable">',
        '<g class="scalable">',
        '<rect class="owl-class-name-rect"/><rect class="owl-class-attrs-rect"/>',
        '</g>',
        '<text class="owl-class-name-text"/><text class="owl-class-attrs-text"/>',
        '</g>'
        ].join(''),

        defaults: joint.util.deepSupplement({

            type: 'owl.OwlClass',

            attrs: {
                rect: { 'width': 200 },

                '.owl-class-name-rect': { 'stroke': 'black', 'stroke-width': 2, 'fill': '#cfe2f3' },
                '.owl-class-attrs-rect': { 'stroke': 'black', 'stroke-width': 2, 'fill': '#cfe2f3' },

                '.owl-class-name-text': {
                    'ref': '.owl-class-name-rect', 'ref-y': .5, 'ref-x': .5, 'text-anchor': 'middle', 'y-alignment': 'middle', 'font-weight': 'bold',
                    'fill': 'black', 'font-size': 12, 'font-family': 'Arial, helvetica, sans-serif'
                },
                '.owl-class-attrs-text': {
                    'ref': '.owl-class-attrs-rect', 'ref-y': 5, 'ref-x': 5,
                    'fill': 'black', 'font-size': 12, 'font-family': 'Arial, helvetica, sans-serif'
                }
            },

            name: [],
            attributes: []

        }, joint.shapes.basic.Generic.prototype.defaults),

        initialize: function() {

            this.on('change:name change:attributes change:methods', function() {
                this.updateRectangles();
                this.trigger('owl-update');
            }, this);

            this.updateRectangles();

            joint.shapes.basic.Generic.prototype.initialize.apply(this, arguments);
        },

        getClassName: function() {
            return this.get('name');
        },

        updateRectangles: function() {

            var attrs = this.get('attrs');

            var rects = [
            { type: 'name', text: this.getClassName() },
            { type: 'attrs', text: this.get('attributes') }
            ];

            var offsetY = 0;

            _.each(rects, function(rect) {

                var lines = _.isArray(rect.text) ? rect.text : [rect.text];
                var rectHeight = lines.length * 20 + 20;

                attrs['.owl-class-' + rect.type + '-text'].text = lines.join('\n');
                attrs['.owl-class-' + rect.type + '-rect'].height = rectHeight;
                attrs['.owl-class-' + rect.type + '-rect'].transform = 'translate(0,' + offsetY + ')';

                offsetY += rectHeight;
            });
        }
    });

    // Shape used for anonymous intersection classes
    var IntersectionClass = joint.shapes.basic.Generic.extend({

        markup: '<g class="rotatable"><g class="scalable"><rect/></g><text/></g>',

        defaults: joint.util.deepSupplement({

            type: 'basic.Rect',
            attrs: {
                'rect': {
                    fill: '#ffffff',
                    stroke: '#000000', 'stroke-width': 1,
                    width: ANON_WIDTH,  height: ANON_HEIGHT,
                    rx: 5, ry: 5
                },
                'text': {
                    fill: '#000000',
                    text: 'intersection',
                    'font-size': 12,
                    'ref-x': .5,
                    'ref-y': .5,
                    'text-anchor': 'middle',
                    'y-alignment': 'middle',
                    'font-family': 'Arial, helvetica, sans-serif'
                }
            }

        }, joint.shapes.basic.Generic.prototype.defaults)
    });

    // A block label that relies on routing to choose directions of link up
    var LabelBlock = joint.shapes.basic.Generic.extend({

        markup: ['<g class="rotatable"><g class="scalable"><rect/></g>',
             '<text class="content"/>',
             '</g>'].join(''),

        defaults: joint.util.deepSupplement({

            type: 'owl.LabelBlock',

            // see joint.css for more element styles
            attrs: {
                rect: {
                    fill: 'white', stroke: 'white', width: LABEL_WIDTH,  height: LABEL_HEIGHT
                },
                text: {
                    fill: 'black', 'font-size': 12, 'font-family': 'Arial, helvetica, sans-serif'
                },
                '.content': {
                    text: '',
                    ref: 'rect',
                    'ref-x': .5,
                    'ref-y': .5,
                    'y-alignment': 'middle',
                    'x-alignment': 'middle'
                }
            },

            content: ''

        }, joint.shapes.basic.Generic.prototype.defaults),

        initialize: function() {
            var attrs = this.get('attrs');
            attrs['.content'].text = this.get('content');
            joint.shapes.basic.Generic.prototype.initialize.apply(this, arguments);
        },

        setDivContent: function(cell, content) {
            // Append the content to div as html.
            cell.attr({ div : {
                html: content
            }});
        }

    });

    // A block label with invisible connetion ports at top and bottom
    var LabelPorts = joint.shapes.basic.Generic.extend(_.extend({}, joint.shapes.basic.PortsModelInterface, {

        markup: '<g class="rotatable"><g class="scalable"><rect class="body"/></g><text class="label"/><g class="inPorts"/><g class="outPorts"/></g>',
        portMarkup: '<g class="port port<%= id %>"><circle class="port-body"/><text class="port-label"/></g>',

        defaults: joint.util.deepSupplement({

//            type: 'devs.Model',   // To match up to devs.ModelView
            type: 'owl.LabelPorts',

            size: { width: 1, height: 1 },

            inPorts: ['in'],
            outPorts: ['out'],

            attrs: {
                '.': { magnet: false },
                '.body': {
                    width: 150, height: 250, stroke: 'none'
                },
                '.port-body': {
                    r: 3, magnet: 'passive', stroke: 'none'
                },
                text: {
                    'pointer-events': 'none'
                },
                '.label': { text: '', 'ref-x': .5, 'ref-y': 10, ref: '.body', 'text-anchor': 'middle', 
                             fill: '#000000', 'font-size': 12, 'font-family': 'Arial, helvetica, sans-serif' },
            }

        }, joint.shapes.basic.Generic.prototype.defaults),

        getPortAttrs: function(portName, index, total, selector, type) {

            var attrs = {};

            var portClass = 'port' + index;
            var portSelector = selector + '>.' + portClass;
            var portBodySelector = portSelector + '>.port-body';

            attrs[portBodySelector] = { port: { id: portName || _.uniqueId(type) , type: type } };
            attrs[portSelector] = { ref: '.body', 'ref-x': 0.5};

            if (selector === '.outPorts') { attrs[portSelector]['ref-dy'] = 0; }

            return attrs;
        }
    }));
    var LabelPortsView = joint.dia.ElementView.extend(joint.shapes.basic.PortsViewInterface);

    // Simple routed link, no arrows, used to connect source to label
    var PropertyIn = joint.dia.Link.extend({
        defaults: {
            type: 'owl.PropertyIn',
            router: { 
                name: 'manhattan', 
                args: {
                    startDirections: ['bottom'],
                    endDirections: ['top']
                }
            },
            connector: { name: 'rounded' }
        }
    });

    // Simple routed link with a plain filled end arrow, used to connect label to target
    var PropertyOut = joint.dia.Link.extend({
        defaults: {
            type: 'owl.PropertyOut',
            attrs: { '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z', fill: 'black' }, '.font-size' : 10},
            router: { 
                name: 'manhattan', 
                args: {
                    startDirections: [ 'bottom'],
                    endDirections: ['top', 'left', 'right']
                }
            },
            connector: { name: 'rounded' }
        }
    });

    // Subclass links
    SubClassOf = joint.dia.Link.extend({
        defaults: {
            type: 'owl.SubClassOf',
            attrs: { '.marker-target': { d: 'M 20 0 L 0 10 L 20 20 L 20 0 z', fill: 'white' }},
            router: { 
                name: 'manhattan', 
                args: {
                    startDirections: [ 'top'],
                    endDirections: ['bottom', 'right']
                }
            },
            connector: { name: 'rounded' }
        }
    });

    // Process the classes and properties
    var indexClass = function(cells, classIndex, spec) {
        var wraptext = joint.util.breakText(spec.label, { width: WIDTH });
        var cls = new OwlClass({
            size: {width: WIDTH, height: HEIGHT},
            name: wraptext
        });
        classIndex[spec.uri] = cls;
        cells.push(cls);
    };

    var linkProperty = function(cells, classIndex, source, target, labelText) {
        _.each(source, function(s){
            _.each(target, function(t){
                var wraptext = joint.util.breakText(labelText, { width: LABEL_WIDTH });
                var label = new LabelBlock({
                    size: {width: LABEL_WIDTH,  height: LABEL_HEIGHT},
                    content : wraptext
                });
                var inLink = new PropertyIn({
                    source: { id: s.id },
                    target: { id: label.id },
                });
                var outLink = new PropertyOut({
                    source: { id: label.id },
                    target: { id: t.id },
                });

                cells.push(label);
                cells.push(inLink);
                cells.push(outLink);
            });
        });
    };

    var lookupClassCells = function(classIndex, classes) {
        var classCells = [];
        _.each(classes, function(cls){
            var cell = classIndex[cls];
            if ( ! _.isUndefined(cell) ) {
                classCells.push(cell);
            }
        });
        return classCells;
    };

    var expandClassSets = function(cells, classIndex, classSpec) {
        if (_.isObject(classSpec)) {
            if (classSpec.type === 'unionOf') {
                return lookupClassCells(classIndex, classSpec.members);
            } else if (classSpec.type === 'intersectionOf') {
                var intersectionCell = new IntersectionClass({size: {width: ANON_WIDTH, height : ANON_HEIGHT}});
                cells.push(intersectionCell);
                _.each(classSpec.members, function(member){
                    var memberCell = classIndex[member];
                    if (!_.isUndefined(memberCell)) {
                        var inLink = new PropertyIn({
                            source: { id: memberCell.id },
                            target: { id: intersectionCell.id },
                        });
                        cells.push(inLink);
                    }
                });
                return [ intersectionCell ];
            }
        } else if (_.isString(classSpec)) {
            return lookupClassCells(classIndex, [classSpec]);
        } 
        // Internal error, should not happen
        console.log("Cannot parse class specification" + classSpec);
        return [];
    };

    var addProperty = function(cells, classIndex, domain, range, labelText) {
        linkProperty(cells, classIndex, 
            expandClassSets(cells, classIndex, domain), 
            expandClassSets(cells, classIndex, range), labelText);
    };

    // experimental code to force a re-routing after layout
    var rerouteAll = function(paper, cells) {
        _.each(cells, function(cell){
            var ty = cell.get('type');
            if (ty === 'owl.PropertyIn' || ty === 'owl.PropertyOut' || ty === 'owl.SubClassOf') {
                paper.findViewByModel(cell).update();                
            }
        });
    };

    var layout = function() {
        var cells = [];
        var classIndex = {};

        _.each(ClassDiagramClasses, _.partial(indexClass, cells, classIndex));
        _.each(ClassDiagramObjectProperties, function(spec){
            addProperty(cells, classIndex, spec.domain, spec.range, spec.label);
        });
        _.each(ClassDiagramClasses, function(spec){
            var sub = classIndex[spec.uri];
            _.each(spec.superClasses, function(supURI){
                var sup = classIndex[supURI];
                if ( ! _.isUndefined(sup) ) {
                    var scLink = new SubClassOf({ 
                        source: { id: sub.id }, 
                        target: { id: sup.id },
                    });
                    cells.push(scLink);
                };
            });
        });

        graph.resetCells( cells );
        joint.layout.DirectedGraph.layout(graph, { setLinkVertices: false });
    }

    // Inject custom views into the joints.shapes namespace
    joint.shapes.owl = {
        OwlClass       : OwlClass,
        LabelPorts     : LabelPorts,
        LabelPortsView : LabelPortsView,
        PropertyOut    : PropertyOut,
        PropertyIn     : PropertyIn
    };

    // Return module contents
    return {
        layout: layout,
        rerouteAll: rerouteAll
    }; 
})();

// Create the layout
var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: 1200,
    height: 1000,
    gridSize: 1,
    model: graph
});

V(paper.viewport).translate(10, 25);     // Just give the viewport a little padding.
classDiagram.layout();
classDiagram.rerouteAll(paper, graph.getCells());
