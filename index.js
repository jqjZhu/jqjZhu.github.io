async function init() {
  const data = await d3.csv("./auto-mpg.csv");
  console.log(data);
  d3.select("body").append("div").attr("class", "d3-tip");
  new Scatter("chart", data, "mpg", "horsepower");
  new TimeSelect("timeselect", data, "scatter");

  d3.select(".s1").on("click", () => {
    new Scatter("chart", data, "mpg", "horsepower");
    new TimeSelect("timeselect", data, "scatter");
  });
  d3.select(".s2").on("click", () => {
    new Pie("chart", data, "", 0.7, "origin");
    new TimeSelect("timeselect", data, "pie");
  });
  d3.select(".s3").on("click", () => {
    new Line("chart", data, "", "model_year", "mpg");
  });
  d3.select(".s4").on("click", () => {
    new Bar("chart", data, "", "cylinders", "mpg");
    new TimeSelect("timeselect", data, "bar");
  });
}

class Scatter {
  constructor(id, data, x, y) {
    this.id = id;
    this.data = data;
    this.x_dim = x;
    this.y_dim = y;
    this.init();
  }

  init() {
    this.initSvg();
    this.initScale();
    this.initAxis();
    this.initLabels();

    this.drawCircle();
  }

  initSvg() {
    const div = d3.select(`#${this.id}`);
    div.selectAll("*").remove();

    let node = div.node().getBoundingClientRect();
    this.w = node.width;
    this.h = node.height;

    this.svg = div.append("svg");
    this.svg.attr("width", this.w).attr("height", this.h);

    this.margin = { left: 50, right: 20, top: 50, bottom: 40 };
    this.innerW = this.w - this.margin.left - this.margin.right;
    this.innerH = this.h - this.margin.top - this.margin.bottom;

    this.chartArea = this.svg
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
  }

  initScale() {
    this.x = d3
      .scaleLinear()
      .domain(d3.extent(this.data, (d) => +d[this.x_dim]))
      .range([0, this.innerW]);

    this.y = d3
      .scaleLinear()
      .domain(d3.extent(this.data, (d) => +d[this.y_dim]))
      .range([this.innerH, 0]);

    this.color = d3
      .scaleOrdinal(d3.schemeTableau10)
      .domain([...new Set(this.data.map((d) => d.origin))]);
  }

  initAxis() {
    this.XAxis = this.chartArea
      .append("g")
      .attr("transform", `translate(0,${this.innerH})`);

    this.YAxis = this.chartArea.append("g");

    this.XAxis.call(d3.axisBottom(this.x));
    this.YAxis.call(d3.axisLeft(this.y));
  }

  initLabels() {
    //x
    this.chartArea
      .append("text")
      .attr("x", this.innerW - 50)
      .attr("y", this.innerH + this.margin.bottom - 50)
      .text(this.x_dim);

    //y
    this.chartArea.append("text").attr("x", 0).attr("y", 10).text(this.y_dim);
    //title
  }

  drawCircle() {
    this.chartArea
      .selectAll("circle")
      .data(this.data)
      .join("circle")
      .attr("cx", (d) => this.x(+d[this.x_dim]))
      .attr("cy", (d) => this.y(+d[this.y_dim]))
      .attr("r", 7)
      .attr("stroke", (d) => this.color(d.origin))
      .attr("fill", (d) => this.color(d.origin))
      .attr("stroke-opacity", 0.3)
      .attr("opacity", 0.6)

      .on("mouseover", (e, d) => {
        this.tips_show(e, d);
      })
      .on("mouseout", () => {
        this.tips_hide();
      });
  }

  tips_show(e, d) {
    d3.select(".d3-tip")
      .style("display", "block")
      .style("position", "absolute")
      .style("top", e.y + "px")
      .style("left", e.x + "px")
      .html(
        () => ` <section>
              <div>
                  <p><strong>${d["car_name"]}</strong></p>
                  <p><strong>${d.origin}</strong></p>
                  <p>${this.x_dim}:  ${d[this.x_dim]}</p>
                  <p>${this.y_dim}:  ${d[this.y_dim]}</p>
                </div>
                    
              </section>`
      );
  }
  tips_hide() {
    d3.select(".d3-tip").style("display", "none");
  }
}

class Line {
  constructor(div, data, title, x_dim, y_dim) {
    this.data = data;
    this.div = div;
    this.title = title;
    this.x_dim = x_dim;
    this.y_dim = y_dim;
    this.handleData();
    this.initSvg();
    this.add_title();
    this.drawLine();
  }
  add_title() {
    // title_text
    this.svg
      .append("text")
      .attr("x", 5)
      .attr("y", 35)
      .attr("class", "chart_title")
      .text(this.title)
      .style("font-size", "1.2rem");
    //title_image

    this.svg
      .append("rect")
      .attr("x", 0)
      .attr("y", 45)
      .attr("width", this.width)
      .attr("height", 0.5)
      .attr("stroke", "lightgray")
      .attr("class", "chart_title_rect");
  }
  handleData() {
    this.lineData = d3
      .rollups(
        this.data,
        (d) => d3.count(d, (v) => +v[this.y_dim]),
        (d) => d[this.x_dim]
      )
      .sort((a, b) => {
        return a[0] > b[0] ? 1 : -1;
      });

    this.lineData.forEach((d) => {
      d[0] = d3.timeParse("%y")(d[0]);
    });
  }

  initSvg() {
    this.init_margin();
    this.init_chart_area();
    this.init_label();
    this.init_scale();
    this.init_axis();
  }
  init_margin() {
    const div = d3.select(`#${this.div}`);
    div.selectAll("*").remove();

    this.getWH(div);
    this.margin = { left: 50, right: 20, top: 60, bottom: 30 };
    this.innerW = this.width - this.margin.left - this.margin.right;
    this.innerH = this.height - this.margin.top - this.margin.bottom;
    div.selectAll("*").remove();
    this.svg = div
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);
  }
  getWH(node) {
    this.width = node.node().getBoundingClientRect().width;
    this.height = node.node().getBoundingClientRect().height;
  }
  init_chart_area() {
    this.ChartArea = this.svg
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
    this.DrawArea = this.ChartArea.append("g");
  }
  init_label() {
    this.ChartArea.append("text")
      .attr("transform", `translate(${this.innerW / 2},${this.innerH + 30})`)
      .text(this.x_dim);
    this.ChartArea.append("text")
      .attr(
        "transform",
        `translate(${-this.margin.left + 10},${this.innerH / 4}) rotate(90)`
      )
      .text(this.y_dim);
  }
  init_scale() {
    this.x = d3
      .scaleTime()
      .range([0, this.innerW])
      .domain(d3.extent(this.lineData, (d) => d[0]));
    this.y = d3
      .scaleLinear()
      .range([this.innerH, 0])
      .domain([0, d3.max(this.lineData, (d) => d[1])]);
  }
  init_axis() {
    this.AxisY = this.ChartArea.append("g");
    this.AxisX = this.ChartArea.append("g").attr(
      "transform",
      `translate(0,${this.innerH})`
    );

    this.AxisX.call(d3.axisBottom(this.x));
    this.AxisY.call(d3.axisLeft(this.y));
  }

  drawLine() {
    this.line = d3
      .line()
      .x((d) => this.x(d[0]))
      .y((d) => this.y(d[1]));
    this.DrawArea.append("path")
      .datum(this.lineData)
      .attr("d", this.line)
      .attr("stroke", "#ed9a9b")
      .attr("stroke-width", 1)
      .attr("fill", "none");
    this.DrawArea.selectAll("circle")
      .data(this.lineData)
      .join("circle")
      .attr("cx", (d) => this.x(d[0]))
      .attr("cy", (d) => this.y(d[1]))
      .attr("r", 10)
      .attr("stroke", "#ed9a9b")
      .attr("stroke-width", 1)
      .attr("fill", "#ed9a9b")
      .on("mouseover", (e, v) => {
        // add mouseover event reference: https://www.d3-graph-gallery.com/graph/interactivity_tooltip.html
        d3.select(".d3-tip")
          .style("display", "block")
          .style("position", "absolute")
          .style("top", e.y + "px")
          .style("left", e.x + "px")
          .style("background-color", "white")
          .style("padding", "5px")
          .html(
            ` <li>${d3.timeFormat("%x")(v[0])}</li><li><strong>${d3.format(
              ".1f"
            )(v[1])}</strong></li>`
          );
      })
      // add mouseout event
      .on("mouseout", () => {
        d3.select(".d3-tip").style("display", "none");
      })
      .on("click", (e, d) => {
        //筛选数据
        this._data = this.data.filter((v) => {
          return d3.timeDay.count(d[0], v.Date) === 0;
        });
        new Bar(this._data, d3.select("#bar"), "天气趋势");
        new Rect(this._data, d3.select("#rect"), "天气趋势");
      });
    //恢复事件
    this.svg.on("dblclick", (e, d) => {
      new Rect(this.data, d3.select("#rect"));
      new Bar(this.data, d3.select("#bar"));
    });
  }
  getWH(node) {
    this.width = node.node().getBoundingClientRect().width;
    this.height = node.node().getBoundingClientRect().height;
  }
}

class Bar {
  constructor(div, data, title, x_dim, y_dim) {
    this.data = data;
    this.div = div;
    this.title = title;
    this.x_dim = x_dim;
    this.y_dim = y_dim;
    this.handleData();
    this.initBarSvg();
    this.drawBar();
    this.add_title();
  }
  add_title() {
    // title_text
    this.svg
      .append("text")
      .attr("x", 5)
      .attr("y", 35)
      .attr("class", "chart_title")
      .text(this.title)
      .style("font-size", "1.2rem");
    //title_image

    this.svg
      .append("rect")
      .attr("x", 0)
      .attr("y", 45)
      .attr("width", this.width)
      .attr("height", 0.5)
      .attr("stroke", "lightgray")
      .attr("class", "chart_title_rect");
  }
  handleData() {
    this.BarData = d3.rollups(
      this.data,
      (d) => d3.mean(d, (v) => +v[this.y_dim]),
      (d) => d[this.x_dim]
    );
    this.BarData.sort((a, b) => {
      return +a[0] > +b[0] ? 1 : -1;
    });
  }
  initBarSvg() {
    this.init_margin();
    this.init_chart_area();
    this.init_label();
    this.init_scale();
    this.init_axis();
  }
  init_margin() {
    let div = d3.select(`#${this.div}`);
    div.selectAll("*").remove();
    this.getWH(div);
    this.margin = { left: 60, right: 20, top: 50, bottom: 30 };
    this.innerW = this.width - this.margin.left - this.margin.right;
    this.innerH = this.height - this.margin.top - this.margin.bottom;
    this.svg = div
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);
  }
  init_chart_area() {
    this.ChartArea = this.svg
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
    this.DrawArea = this.ChartArea.append("g");
  }
  init_label() {
    this.ChartArea.append("text")
      .attr("transform", `translate(${this.innerW / 2},${this.innerH + 30})`)
      .text(this.x_dim);
    this.ChartArea.append("text")
      .attr("transform", `translate(${-55},${this.innerH / 4}) rotate(90)`)
      .text(this.y_dim);
    //title
  }
  init_scale() {
    this.x = d3
      .scaleBand()
      .range([0, this.innerW])
      .domain(this.BarData.map((d) => d[0]))
      .padding(0.3);
    this.y = d3
      .scaleLinear()
      .range([this.innerH, 0])
      .domain([0, d3.max(this.BarData, (d) => d[1])]);
  }
  init_axis() {
    this.AxisY = this.ChartArea.append("g");
    this.AxisX = this.ChartArea.append("g").attr(
      "transform",
      `translate(0,${this.innerH})`
    );
    this.AxisX.call(d3.axisBottom(this.x));
    this.AxisY.call(d3.axisLeft(this.y));
  }

  getWH(node) {
    this.width = node.node().getBoundingClientRect().width;
    this.height = node.node().getBoundingClientRect().height;
  }
  drawBar() {
    this.DrawArea.selectAll("rect")
      .data(this.BarData)
      .join("rect")
      .attr("class", (d) => d[0]) //设置一个类名,方便后续调用
      .attr("x", (d) => this.x(d[0]))
      .attr("y", (d) => this.y(d[1]))
      .attr("width", this.x.bandwidth())
      .attr("height", (d) => this.innerH - this.y(d[1]))
      .attr("stroke", "black")
      .attr("stroke-width", "0.25")
      .attr("fill", "#4e79a7")
      .on("mouseover", (e, v) => {
        d3.select(".d3-tip")
          .style("display", "block")
          .style("position", "absolute")
          .style("top", e.pageY + "px")
          .style("left", e.pageX + "px")
          .style("background-color", "white")
          .style("padding", "5px")
          .html(
            ` <li>${v[0]}</li><li><strong>${d3.format(".1f")(
              v[1]
            )}</strong></li>`
          );
      })
      // add mouseout event
      .on("mouseout", () => {
        d3.select(".d3-tip").style("display", "none");
      })
      .on("click", (e, d) => {
        //筛选数据
        this._data = this.data.filter((v) => {
          return v.location === d[0];
        });
        new Line(this._data, d3.select("#line"), "天气趋势");
        new Rect(this._data, d3.select("#rect"), "天气趋势");
      });

    //恢复事件
    this.svg.on("dblclick", (e, d) => {
      new Rect(this.data, d3.select("#rect"));
      new Line(this.data, d3.select("#line"));
    });
  }
}

class Pie {
  constructor(id, data, title, innerRadius = 0.7, filedName = "") {
    this.filedName = filedName;
    this.id = id;
    this.inner = innerRadius;
    this.data = data;
    this.title = title;
    this.handleData();
    this.initSvg();
  }
  handleData() {
    this.pieData = d3.rollups(
      this.data,
      (d) => d.length,
      (d) => d[this.filedName]
    );
  }
  initSvg() {
    let div = d3.select(`#${this.id}`);
    div.selectAll("*").remove();
    this.getWH(div);
    this.margin = { left: 60, right: 20, top: 30, bottom: 30 };
    this.innerW = this.width - this.margin.left - this.margin.right;
    this.innerH = this.height - this.margin.top - this.margin.bottom;
    this.svg = div
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);
    this.ChartArea = this.svg
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    //titles
    this.svg.append("text").attr("x", 20).attr("y", 20).text(this.title);
    this.initPie();
  }
  initPie() {
    this.outerRadius = Math.min(this.width, this.height) / 2.5;
    this.innerRadius = this.outerRadius * this.inner;
    this.g = this.svg
      .append("g")
      .attr("transform", `translate(${this.width / 2},${this.height / 1.8})`); //到达svg中心位置,开始画圆

    this.pieData = d3.pie().value((d) => d[1])(this.pieData);
    //arcs
    this.arc = d3
      .arc()
      .innerRadius(this.innerRadius)
      .outerRadius(this.outerRadius)
      .startAngle((d) => d.startAngle)
      .endAngle((d) => d.endAngle)
      .padAngle(0.01)
      .padRadius(this.innerRadius);

    // colors
    let color_array = d3.schemeTableau10; // ["#e18401", "#00aeed", "#0db641", "#e72e58", "purple"];
    this.color = d3
      .scaleOrdinal()
      .domain(this.pieData.map((d) => d.data[0]))
      .range(color_array); //颜色对应

    // this.addmarkerLine();
    this.addPie();
    this.addPieText();
  }
  addPie() {
    this.g
      .selectAll(".piepath")
      .data(this.pieData)
      .join("path")
      .attr("class", "piepath")
      .attr("d", this.arc)
      .attr("fill", (d) => this.color(d.data[0]));
  }

  addPieText() {
    let text = this.g
      .selectAll(".linetext")
      .data(this.pieData)
      .join("text")
      .attr("class", "linetext")
      .attr("font-size", 12)
      .attr("x", (d) => this.arc.centroid(d)[0])
      .attr("y", (d) => this.arc.centroid(d)[1])
      .text(
        (d) =>
          d.data[0] +
          "/" +
          d3.format(".0%")((d.endAngle - d.startAngle) / (Math.PI * 2))
      );
  }
  getWH(node) {
    this.width = node.node().getBoundingClientRect().width;
    this.height = node.node().getBoundingClientRect().height;
  }
}

class TimeSelect {
  constructor(id, data, initchart) {
    this.id = id;
    this.data = data;
    this.chart = initchart;
    this.init();
  }

  init() {
    let div = d3.select(`#${this.id}`);
    div.selectAll("*").remove();

    this.input = div
      .append("input")
      .attr("type", "range")
      .attr("min", 70)
      .attr("max", 82)
      .attr("step", 1);

    div.append("span").attr("class", "yearlabel");

    this.input.on("change", (e) => {
      this.new_data = this.data.filter(
        (d) => +d.model_year === +e.target.value
      );

      d3.select(".yearlabel").html(`19${e.target.value}`);
      if (this.chart === "scatter") {
        new Scatter("chart", this.new_data, "mpg", "horsepower");
      } else if (this.chart === "bar") {
        new Bar("chart", this.new_data, "", "cylinders", "mpg");
      } else if (this.chart === "pie") {
        new Pie("chart", this.new_data, "", 0.7, "origin");
      }
    });
  }
}
init();
