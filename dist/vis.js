// Generated by CoffeeScript 2.4.1
// toggle amount of info per box
//   main: symbol
//   add four more as grid (x x) (x x)
//   demonstrate using template

// grid numbers
//   period x group

// height range on legend
//   min .. max, filter

// select (with grid numbers, legend boxes, height range)
//   unselected -> fade

// Write
// links to wikipedia article, scraper
//   "Please do not use a web crawler to download large numbers of articles. Aggressive crawling of the server can cause a dramatic slow-down of Wikipedia."
// description of visualization
// more comments
// Credit: Bostock

// Call d3.json once the
// "document has finished loading (but not its dependent resources)"
var interpolateFloor, mk_periodic_table, niceFormat, perceivable_inverse, vis;

vis = void 0;

d3.select(document).on('DOMContentLoaded', function() {
  // Print them
  vis = mk_periodic_table();
  vis.root(d3.select('div.vis').append('div').classed('periodic_table', true));
  return vis(all_chemical_elements);
});

niceFormat = function(n) {
  if (Math.log10(n) > 3) {
    return d3.format(',.4s')(n);
  } else {
    return d3.format(',.2f')(n);
  }
};

interpolateFloor = function(a, b) {
  a = +a;
  b = +b;
  return function(t) {
    return Math.floor(a * (1 - t) + b * t);
  };
};

perceivable_inverse = function(col) {
  var c, diff, oc;
  c = d3.hcl(col);
  oc = d3.hcl(col);
  if (col === 'black' || col === '#000' || col === '#000000') {
    // kindof fixes bug with d3.hcl, d3.rgb, d3.lab, d3.hsl and the color black
    return 'white';
  }
  if (isNaN(c.h)) {
    return 'black';
  }
  // Find the complementary color
  c.h = (360 - (180 + c.h)) - 180;
  c.c = 100 - c.c;
  c.l = 100 - c.l;
  // Increase luminance difference between 'a' and its complementary color
  // Examples luminance pairs:
  //    a,   before (100% - a),    after
  //   0%,                100%,      101%
  //  12%,                 88%,    90.55%
  //  45%,                 55%,    88.81% <----
  //  49%,                 51%,    97.23% <---- why this is needed
  //  65%,                 35%,    19.53%
  diff = Math.sign(c.l - oc.l) * Math.exp((Math.log(100)) * (100 - Math.abs(c.l - oc.l)) / 100) / 2;
  c.l += diff;
  return c;
};

mk_periodic_table = function() {
  var _height, classifiers, clearHighlights, colClass, color, colorElement, colorPalette, control_container, draw_controls, draw_legend, elemScale, elemSize, elementsData, floatToColor, g, height, heightClass, highlightElement, invertExtentColor, layout, legend, margin, nCategories, prettyNames, root, svg, tip, width, zoom, zoomed;
  // Private variables
  svg = void 0;
  g = void 0;
  root = void 0;
  layout = void 0;
  tip = void 0;
  control_container = void 0;
  legend = void 0;
  elementsData = void 0;
  _height = {
    path: null,
    line: null
  };
  // Sane defaults
  height = 600;
  width = Math.round(height * (1 + Math.sqrt(5)) / 2);
  // Space needed: 10 down, 19 right
  elemSize = width / 19;
  elemScale = 1.0;
  margin = {
    top: 5,
    left: 5
  };
  zoomed = false;
  zoom = d3.behavior.zoom().scaleExtent([0.5, 10]).center([(margin.left + width) / 2, (margin.top + height) / 2]).size([margin.left + width, margin.top + height]);
  // Color palette. color[n] gives a palette for n categories (3 to 9)
  nCategories = 7;
  colorPalette = colorbrewer.YlOrRd[nCategories];
  colClass = 'by_weight';
  heightClass = 'by_weight';
  classifiers = {
    by_weight: {
      // Function that extracts numerical value from node
      accessor: function(d, _) {
        if (_ != null) {
          return d['atomicWeight'] = _;
        } else {
          return d['atomicWeight'];
        }
      }
    },
    // Should be a dictionary from classifier names to d3.scales
    // classify: undefined
    by_electronegativity: {
      accessor: function(d, _) {
        if (_ != null) {
          return d['eneg'] = _;
        } else {
          return d['eneg'];
        }
      }
    },
    by_boiling_point: {
      accessor: function(d, _) {
        if (_ != null) {
          return d['boilingPoint'] = _;
        } else {
          return d['boilingPoint'];
        }
      }
    },
    by_melting_point: {
      accessor: function(d, _) {
        if (_ != null) {
          return d['meltingPoint'] = _;
        } else {
          return d['meltingPoint'];
        }
      }
    },
    by_abundance: {
      accessor: function(d, _) {
        if (_ != null) {
          return d['abundance'] = _;
        } else {
          return d['abundance'];
        }
      }
    },
    by_density: {
      accessor: function(d, _) {
        if (_ != null) {
          return d['density'] = _;
        } else {
          return d['density'];
        }
      }
    },
    by_heat: {
      accessor: function(d, _) {
        if (_ != null) {
          return d['heat'] = _;
        } else {
          return d['heat'];
        }
      }
    }
  };
  prettyNames = [['Atomic number', 'atomicNumber'], ['Weight (amu)', 'atomicWeight'], ['Boiling point (K)', 'boilingPoint'], ['Melting point (K)', 'meltingPoint'], ['Electronegativity', 'eneg'], ['Abundance (mg/kg)', 'abundance']];
  // Should map from [0,1] to {0..classifier.size - 1}
  floatToColor = void 0;
  color = function(d) {
    var c, ix, result;
    if (!colClass) {
      return 'white';
    }
    c = classifiers[colClass];
    ix = floatToColor(c.classify(c.accessor(d)));
    result = colorPalette[ix];
    if (result == null) {
      result = perceivable_inverse(colorPalette[nCategories - 1]);
    }
    return result;
  };
  invertExtentColor = function(d) {
    var c, extent, ix;
    c = classifiers[colClass];
    ix = colorPalette.indexOf(d);
    if (ix < 0) {
      return '?';
    }
    extent = floatToColor.invertExtent(ix);
    return [c.classify.invert(extent[0]), c.classify.invert(extent[1])];
  };
  // Prepare and activate d3.tip tooltips
  tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
    var j, len, name, prop, s;
    // Tooltip content. Nice labels and all data within d
    s = `<em>${d.name} (${d.sym})</em><table>`;
    for (j = 0, len = prettyNames.length; j < len; j++) {
      [name, prop] = prettyNames[j];
      s += `<tr> <td>${name}:</td> <td>${(d[prop] != null ? d[prop] : '?')}</td> </tr>`;
    }
    s += '</table>';
    return s;
  });
  clearHighlights = function() {
    return g.each(function(d) {
      d.highlighted = false;
      return colorElement(d, this);
    });
  };
  highlightElement = function(d) {
    colorElement(d, null, function() {
      return 'blue';
    });
    return d.highlighted = true;
  };
  // Set data and draw the visualization
  vis = function(data) {
    var d, defaultColors, defaultText, j, k, len, no_group_x, step, v, val;
    elementsData = data;
// Find range of classifiers
    for (j = 0, len = elementsData.length; j < len; j++) {
      d = elementsData[j];
      for (k in classifiers) {
        v = classifiers[k];
        val = v.accessor(d);
        if (val == null) {
          continue;
        }
        // Clean up the number
        val = parseFloat(val.replace('[', '').replace(']', ''));
        if (isNaN(val)) {
          continue;
        }
        // Set it
        v.accessor(d, val);
        if ((v['max'] == null) || v['max'] < val) {
          v['max'] = val;
        }
        if ((v['min'] == null) || v['min'] > val) {
          v['min'] = val;
        }
      }
    }
// Define each classifier's classify() according to its range
    for (k in classifiers) {
      v = classifiers[k];
      step = (v['max'] - v['min']) / nCategories;
      v['classify'] = d3.scale.linear().clamp(true).domain([v['min'], v['max']]).range([0, 1]);
    }
    if (colClass) {
      floatToColor = d3.scale.quantile().domain([0, 1]).range(d3.range(nCategories));
    }
    // CLEAR THE ROOT
    root.selectAll('*').remove();
    // Append a new SVG
    // Set dimensions, account for margins
    // Add class
    svg = root.append('svg').attr('width', width + 2 * margin.left).attr('height', height + 2 * margin.top).classed('periodic_table', true);
    // Center the SVG within the margins. Use a <g> element
    svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
    // Used for Lanthanide and Actanide series (periods 6 and 7)
    no_group_x = {
      6: 3,
      7: 3
    };
    // Set data to the given array
    // For each of these elements, append a <g> (SVG group)
    g = svg.select('g').selectAll('g.element').data(elementsData).enter().append('g');
    // Every <g> gets the same class
    g.attr('class', function(d) {
      return `element ${d.sym} ${d.name}`;
    // The <g>'s 'transform' is dependent on the element
    }).each(function(d) {
      var svg_elem;
      svg_elem = d3.select(this);
      if (d.group != null) {
        d.x = d.group * elemSize;
        d.y = d.period * elemSize;
        // Make gap for Lanthanides and Actanides
        if (d.group >= 3) {
          d.x += elemSize;
        }
        // Add CSS class dependent on element's group
        // Examples: group_1, group_2 ...
        svg_elem.classed(`group_${d.group}`, true);
      } else {
        // Place in order and with a 1 row gap
        // TODO XXX MAJOR BUG! WHAT IF UNORDERED IN DATA? XXX TODO
        d.x = (no_group_x[d.period]++) * elemSize;
        d.y = (3 + (+d.period)) * elemSize;
        // Add CSS class nogroup
        svg_elem.classed('nogroup', true); // Neither a Lanthanide nor an Actanide
      }
      // CSS period class
      return svg_elem.classed(`period_${d.period}`, true);
    // Translate the element according to its period + group
    }).attr('transform', function(d) {
      return `translate(${d.x - elemSize / 2},${d.y}) scale(${elemScale})`;
    });
    defaultText = function(d) {
      return d3.select(this).style('fill', perceivable_inverse(color(d)));
    };
    defaultColors = function(d) {
      return d3.select(this).style('fill', color(d)).style('stroke', perceivable_inverse(color(d)));
    };
    // Append a <rect> to every <g> or nothing gets shown
    // Set dimensions. The (* 0.92) creates gaps between elements
    g.append('rect').classed('element_box', true).attr('height', elemSize).attr('width', elemSize).attr('x', -elemSize / 2).attr('y', -elemSize / 2).each(defaultColors);
    // Add <text> label to each <g>
    // Set text to d.sym
    // Examples: H, O, F, Ni, Uuo
    g.append('text').classed('symbol box_info', true).attr('y', 7).each(defaultText).text(function(d) {
      return d.sym;
    });
    g.append('text').classed('box_info', true).text(function(d) {
      return niceFormat(d.atomicWeight);
    }).attr('y', 21).each(defaultText);
    g.append('text').classed('box_info', true).attr('y', -14).attr('x', 14).each(defaultText).text(function(d) {
      return d.atomicNumber;
    });
    draw_controls();
    if (colClass) {
      draw_legend();
    }
    svg.call(zoom);
    // zoom off by default
    vis.togglezoom(false);
    svg.call(tip);
    vis.togglehovertips(true);
    vis.heightClass(heightClass);
    return vis;
  };
  // Return the SVG
  vis.svg = function() {
    return svg;
  };
  // Set/get the root
  vis.root = function(_) {
    if (!arguments.length) {
      return root;
    }
    root = _;
    return vis;
  };
  vis.classifiers = function() {
    return classifiers;
  };
  vis.togglezoom = function(turnOn) {
    if (turnOn) {
      return zoom.on('zoom', function() {
        zoomed = !(d3.event.scale === 1);
        return svg.select('g').attr('transform', `translate(${d3.event.translate}) scale(${d3.event.scale})`);
      });
    } else {
      zoom.on('zoom', null);
      return svg.select('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
    }
  };
  vis.togglehovertips = function(turnOn) {
    if (turnOn) {
      return g.on('mouseenter', tip.show).on('mouseleave', tip.hide);
    } else {
      return g.on('mouseenter', null).on('mouseleave', null);
    }
  };
  colorElement = function(d, e, colorFun) {
    if (d.highlighted) {
      return;
    }
    if (colorFun == null) {
      colorFun = color;
    }
    if (e == null) {
      e = svg.select(`g.${d.sym}`);
    } else {
      e = d3.select(e);
    }
    e.selectAll('path.element_box, rect.element_box').transition().style('fill', colorFun(d)).style('stroke', perceivable_inverse(colorFun(d)));
    e.selectAll('line.element_box').transition().style('stroke', perceivable_inverse(colorFun(d)));
    return e.selectAll('text.box_info').transition().style('fill', perceivable_inverse(colorFun(d)));
  };
  vis.colClass = function(_) {
    if (!arguments.length) {
      return colClass;
    }
    colClass = _;
    if (legend != null) {
      legend.remove();
    }
    if (colClass) {
      floatToColor = d3.scale.quantile().domain([0, 1]).range(d3.range(nCategories));
      draw_legend();
    }
    g.each(function(d) {
      return colorElement(d, this);
    });
    return vis;
  };
  vis.heightClass = function(_) {
    if (!arguments.length) {
      return heightClass;
    }
    heightClass = _;
    if (!heightClass) {
      g.selectAll('path, line').remove();
      _height = {
        path: null,
        line: null
      };
      elemScale = 1.0;
      g.transition().attr('transform', function(d) {
        return `translate(${d.x - elemSize / 2},${d.y}) scale(${elemScale})`;
      });
    } else {
      elemScale = 0.7;
      g.each(function(d) {
        var c, h;
        c = classifiers[heightClass];
        h = c.classify(c.accessor(d));
        d._heightOff = h * elemSize * Math.sqrt(2) * (1 - elemScale);
        if ((d._heightOff == null) || isNaN(d._heightOff)) {
          return d._heightOff = 0;
        }
      }).transition().attr('transform', function(d) {
        return `translate(${d._heightOff / 2 + d.x - elemSize / 2}, ${d.y - d._heightOff / 2}) scale(${elemScale})`;
      });
      if (_height.path == null) {
        _height.path = g.insert('path', ':first-child').style('fill', function(d) {
          return color(d);
        }).style('stroke', function(d) {
          return perceivable_inverse(color(d));
        }).attr('class', 'element_box');
      }
      if (_height.line == null) {
        _height.line = g.insert('line', ':nth-child(2)').attr('class', 'element_box').style('stroke', function(d) {
          return perceivable_inverse(color(d));
        }).attr('x0', 0).attr('y0', 0).attr('x1', 0).attr('y1', 0);
      }
      _height.path.transition().attr('d', function(d) {
        return `M ${-elemSize / 2} ${-elemSize / 2} l ${-d._heightOff} ${d._heightOff} l 0 ${elemSize} l ${elemSize} 0 l ${d._heightOff} ${-d._heightOff} z`;
      });
      _height.line.transition().attr('x1', function(d) {
        return -d._heightOff - elemSize / 2;
      }).attr('y1', function(d) {
        return d._heightOff + elemSize / 2;
      });
    }
    return vis;
  };
  // Set/get the width and height
  vis.dimensions = function(_) {
    if (!arguments.length) {
      return [width, height];
    }
    width = _[0];
    height = _[1];
    return vis;
  };
  draw_legend = function() {
    var c, cols, legend_elem, rows, x_per, y_per;
    c = classifiers[colClass];
    y_per = 30;
    rows = 3;
    x_per = width / (nCategories + 1) * rows * 0.43;
    cols = Math.ceil((nCategories + 1) / rows);
    // Color palette
    legend = control_container.append('svg').classed('color_legend', true).style('display', 'none').attr('width', cols * x_per).attr('height', rows * y_per * 1.1);
    legend_elem = legend.selectAll('g.color').data(colorPalette.concat([perceivable_inverse(colorPalette[nCategories - 1])])).enter().append('g').classed('color', true).attr('transform', function(d, i) {
      return `translate(${(i - i % rows) * x_per / rows}, ${(i % rows) * y_per})`;
    });
    legend_elem.append('rect').classed('element_box', true).attr('width', y_per * 0.8).attr('height', y_per * 0.8).style('fill', function(d) {
      return d;
    }).style('stroke', function(d) {
      return perceivable_inverse(d);
    });
    return legend_elem.append('text').attr('y', y_per / 2).attr('x', y_per * 0.85).text(function(d) {
      var ex;
      ex = invertExtentColor(d);
      if (typeof ex === 'string') {
        return `${ex}`;
      } else {
        return `${niceFormat(ex[0])} - ${niceFormat(ex[1])}`;
      }
    });
  };
  draw_controls = function() {
    var _class, _control_wrap, cc, control_wrap, j, l, len, len1, ref, ref1, x;
    // <div> if none exists
    if (control_container == null) {
      control_container = root.insert('div', ':first-child').classed('controls', true);
    }
    control_wrap = control_container.append('div').classed('main_controls', true);
    control_wrap.append('h1').text('Periodic Table');
    ref = [['heightClass', 'Height'], ['colClass', 'Colors']];
    // Color classifier selector
    for (j = 0, len = ref.length; j < len; j++) {
      _class = ref[j];
      cc = control_wrap.append('p');
      cc.classed(`title cell ${_class[0]}`, true).text(`${_class[1]}: `);
      _class = _class[0];
      cc.append('span').append('select').attr('onchange', `vis.${      // empty string = javascript false
_class}(this.value)`).selectAll('option').data(Object.keys(classifiers).concat([""])).enter().append('option').each(function(d) {
        if (d === vis[_class]() || (!vis[_class]() && !d)) {
          return d3.select(this).attr('selected', 'selected');
        }
      }).attr('value', function(d) {
        return d;
      }).text(function(d) {
        if (d) {
          return d.split('_').join(' ');
        } else {
          return 'none';
        }
      });
    }
    _control_wrap = control_wrap.append('p');
    ref1 = ['zoom', 'hovertips'];
    for (l = 0, len1 = ref1.length; l < len1; l++) {
      x = ref1[l];
      cc = _control_wrap.append('span');
      cc.append('input').attr('type', 'checkbox').attr('aria-labelledby', `toggle_${x}`).attr('id', `toggle_${      // zoom is off by default
x}_checkbox`).attr('checked', x === 'zoom' ? null : 'checked').on('change', (function(x) {
        return function() {
          return vis[`toggle${x}`](d3.select(this).property('checked'));
        };
      // scope issue fix.
      })(x));
      cc.append('label').attr('id', `toggle_${x}`).attr('for', `toggle_${x}_checkbox`).text(`Toggle ${x}`);
    }
    cc = control_wrap.append('p');
    cc.append('label').attr('id', 'search_label').attr('for', 'search').text("Search by any property");
    return cc.append('input').attr('type', 'input').attr('aria-labelledby', 'search_label').attr('id', 'search').attr('placeholder', 'Search here').on('input', function() {
      var e, k, len2, m, results, results1, v;
      results = {};
      // Search every property of every element
      if (this.value) {
        for (m = 0, len2 = elementsData.length; m < len2; m++) {
          e = elementsData[m];
          for (k in e) {
            v = e[k];
            if (('' + v).toLowerCase().indexOf(this.value.toLowerCase()) >= 0) {
              results[e.name] = e;
            }
          }
        }
      }
      clearHighlights();
      results1 = [];
      for (k in results) {
        v = results[k];
        results1.push(highlightElement(v));
      }
      return results1;
    });
  };
  return vis;
};

//# sourceMappingURL=vis.js.map