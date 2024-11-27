let currentChartData = null;


document.querySelectorAll(".data-filter").forEach(filter => {
    filter.addEventListener("change", () => {
        const selectedFilter = document.querySelector(".data-filter:checked").value;

        if (selectedFilter === "escolaridade") {
            
            document.getElementById("filters-education").style.display = "block";
            document.getElementById("education-filters").style.display = "block";
        } else {
          
            document.getElementById("filters-education").style.display = "none";
            document.getElementById("education-filters").style.display = "none";
        }
    });
});

export function createCharts(data, currentFilter) {
    currentChartData = data;
    const { selectedGenders, selectedEducationLevels } = getSelectedFilters();

    console.log("Filtro atual:", currentFilter);
    console.log("Gêneros selecionados:", selectedGenders);
    console.log("Graus de ensino selecionados:", selectedEducationLevels);
    console.log("Dados:", data);


    if (currentFilter === "escolaridade") {
        
        const filteredData = prepareEducationAndGenderFilteredData(data, selectedGenders, selectedEducationLevels);
        const filteredData2 = prepareEducationStackedData(data, selectedEducationLevels);
        const filteredData3 = prepareEducationPieChart(data, selectedEducationLevels);
        
        d3.select("#chart-bar").html("");
        createGroupedEducationGenderChart(filteredData, "#chart-bar");
        
        d3.select("#chart-stacked-bar").html("");
        createStackedBarChart(filteredData2, "#chart-stacked-bar");

        d3.select("#chart-donut").html("");
        createDonutChart(filteredData3, "#chart-donut");
        
        return; 
    }

    const ageRanges = Object.keys(data).filter(key => key.startsWith("HM-"));
    const barData = ageRanges.map(key => ({
        faixa: key.replace("HM-", ""),
        total: +data[key]
    }));
    const donutData = [
        { label: "Homens", value: +data["H"] },
        { label: "Mulheres", value: +data["M"] }
    ];
    const stackedData = ageRanges.map(key => ({
        faixa: key.replace("HM-", ""),
        homens: +data[key.replace("HM-", "H-")],
        mulheres: +data[key.replace("HM-", "M-")]
    }));
    const pyramidData = ageRanges.map(key => ({
        faixa: key.replace("HM-", ""),
        homens: +data[key.replace("HM-", "H-")],
        mulheres: +data[key.replace("HM-", "M-")]
    }));

    d3.select("#chart-bar").html("");
    d3.select("#chart-donut").html("");
    d3.select("#chart-stacked-bar").html("");
    d3.select("#pyramid-svg").html("");
    d3.select("#top-graphic").html("");

    createBarChart(barData, "#chart-bar");
    createDonutChart(donutData, "#chart-donut");
    createStackedBarChart(stackedData, "#chart-stacked-bar");
    createPopulationPyramid(pyramidData, "#pyramid-svg");
}


function createBarChart(data, selector) {

    const margin = { top: 20, right: 30, bottom: 50, left: 80 }; 
    const width = 400 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(selector)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(data.map(d => d.faixa))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total)])
        .nice()
        .range([height, 0]);


    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "5px 10px")
        .style("border-radius", "5px")
        .style("box-shadow", "0px 0px 10px rgba(0,0,0,0.1)")
        .style("pointer-events", "none")
        .style("display", "none");

    svg.append("g")
        .selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.faixa))
        .attr("y", d => y(d.total))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.total))
        .attr("fill", "#66b3ff")
        .on("mouseover", function (event, d) {
            d3.select(this).attr("fill", "#3385cc");
            tooltip.style("display", "block")
                .html(`<strong>${d.faixa}</strong><br>Total: ${d.total.toLocaleString()}`);
        })
        .on("mousemove", function (event) {
            tooltip.style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 20 + "px");
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill", "#66b3ff");
            tooltip.style("display", "none");
        });

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -10) 
        .attr("y", -4) 
        .style("text-anchor", "end") 
        .style("font-size", "10px"); 

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom + 5)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Faixa Etária");


    svg.append("g").call(d3.axisLeft(y));

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left - 3)
        .attr("x", 0 - height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("População Total");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - margin.top / 2 + 3)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Distribuição por Faixa Etária");

    const legendData = [
        { label: "Total - HM", color: "#66b3ff" }
    ];

    const legend = svg.append("g")
        .attr("transform", `translate(${width - 50}, ${height - 220})`); 

    legendData.forEach((d, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`);

        legendRow.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", d.color);

        legendRow.append("text")
            .attr("x", 20)
            .attr("y", 10)
            .attr("font-size", "12px")
            .attr("text-anchor", "start")
            .text(d.label);
    });
}


function createDonutChart(data, selector) {
    const width = 400; 
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(selector)
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${radius}, ${height / 2})`);

    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.label))
        .range(["#4682b4", "#ff7f50"]);

    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc().innerRadius(radius - 70).outerRadius(radius);

    const hoverArc = d3.arc().innerRadius(radius - 70).outerRadius(radius + 10);

    const totalPessoas = data.reduce((sum, d) => sum + d.value, 0);

    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "5px 10px")
        .style("border-radius", "5px")
        .style("box-shadow", "0px 0px 10px rgba(0,0,0,0.1)")
        .style("pointer-events", "none")
        .style("display", "none");

    svg.selectAll("path")
        .data(pie(data))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.label))
        .on("mouseover", function (event, d) {
            d3.select(this).transition().duration(200).attr("d", hoverArc);
            tooltip.style("display", "block")
                .html(
                    `<strong>${d.data.label}</strong><br>` +
                    `Total: ${d.data.value.toLocaleString()}`
                );
        })
        .on("mousemove", function (event) {
            tooltip.style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", function () {
            d3.select(this).transition().duration(200).attr("d", arc);
            tooltip.style("display", "none");
        });

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("y", -10)
        .text("Homens vs Mulheres");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("y", 20)
        .text(`Total: ${totalPessoas.toLocaleString()}`);

    const legendData = [
        { label: "Homens", color: "#4682b4" },
        { label: "Mulheres", color: "#ff7f50" }
    ];

    console.log("Legend data:", legendData); 

    const legend = svg.append("g")
        .attr("transform", `translate(${radius + 10}, ${-radius})`); 

    legendData.forEach((d, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`);

        legendRow.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", d.color);

        legendRow.append("text")
            .attr("x", 18)
            .attr("y", 10)
            .attr("font-size", "12px")
            .attr("text-anchor", "start")
            .text(d.label);
    });
}


function createStackedBarChart(data, selector) {
    const margin = { top: 20, right: 30, bottom: 50, left: 80 }; 
    const width = 400 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(selector)
        .append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(data.map(d => d.faixa))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.homens + d.mulheres)])
        .nice()
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(["Homens", "Mulheres"])
        .range(["#4682b4", "#ff7f50"]);

    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "5px 10px")
        .style("border-radius", "5px")
        .style("box-shadow", "0px 0px 10px rgba(0,0,0,0.1)")
        .style("pointer-events", "none")
        .style("display", "none");

    svg.selectAll(".bar-group")
        .data(data)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${x(d.faixa)}, 0)`)
        .selectAll("rect")
        .data(d => [
            { label: "Homens", value: d.homens, total: d.homens + d.mulheres },
            { label: "Mulheres", value: d.mulheres, total: d.homens + d.mulheres }
        ])
        .enter()
        .append("rect")
        .attr("y", (d, i, nodes) => y(d.value + d3.sum(nodes.slice(0, i).map(n => d3.select(n).datum().value))))
        .attr("height", d => height - y(d.value))
        .attr("width", x.bandwidth())
        .attr("fill", d => color(d.label))
        .on("mouseover", function (event, d) {
            d3.select(this).attr("stroke", "#000").attr("stroke-width", 1.5);
            tooltip.style("display", "block")
                .html(
                    `<strong>${d.label}</strong><br>` +
                    `Pessoas: ${d.value.toLocaleString()}<br>` +
                    `Total na Faixa: ${d.total.toLocaleString()}`
                );
        })
        .on("mousemove", function (event) {
            tooltip.style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", function () {
            d3.select(this).attr("stroke", "none");
            tooltip.style("display", "none");
        });


    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-90)") 
        .attr("x", -10) 
        .attr("y", -4) 
        .style("text-anchor", "end") 
        .style("font-size", "10px"); 
    
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 12)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Faixa Etária");

    svg.append("g").call(d3.axisLeft(y));


    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 10 - margin.left)
        .attr("x", 0 - height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("População Total");


    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -8)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Distribuição por Gênero e Faixa Etária");


    const legendData = [
        { label: "Homens", color: "#4682b4" },
        { label: "Mulheres", color: "#ff7f50" }
    ];

    const legend = svg.append("g")
        .attr("transform", `translate(${width - 40}, 6)`); 

    legendData.forEach((d, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`); 

        legendRow.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", d.color);

        legendRow.append("text")
            .attr("x", 18)
            .attr("y", 10)
            .attr("font-size", "12px")
            .attr("text-anchor", "start")
            .text(d.label);
    });
}


export function createPopulationPyramid(data) {
    const margin = { top: 20, right: 30, bottom: 50, left: 80 };
    const width = 400 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

 
    const container = d3.select("#pyramid-svg");
    container.html(""); 

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


    const men = data.map(d => ({ faixa: d.faixa, value: -d.homens }));
    const women = data.map(d => ({ faixa: d.faixa, value: d.mulheres }));


    const x = d3.scaleLinear()
        .domain([-d3.max(men, d => Math.abs(d.value)), d3.max(women, d => d.value)])
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(data.map(d => d.faixa))
        .range([height, 0])
        .padding(0.1);


    svg.append("g")
        .call(d3.axisLeft(y).tickSize(0)) 
        .selectAll("text")
        .attr("dy", y.bandwidth() / 2) 
        .style("text-anchor", "middle") 
        .attr("transform", `translate(-30,0)`);


    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px") 
        .text("Faixa Etária");

  
    svg.append("text")
        .attr("x", width / 2) 
        .attr("y", height + margin.bottom - 10) 
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("População Total");

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d => Math.abs(d)));

   
    svg.selectAll(".bar-women")
        .data(women)
        .enter()
        .append("rect")
        .attr("class", "bar-women")
        .attr("x", d => x(0))
        .attr("y", d => y(d.faixa))
        .attr("width", d => x(d.value) - x(0))
        .attr("height", y.bandwidth())
        .attr("fill", "#ff7f50");

   
    svg.selectAll(".bar-men")
        .data(men)
        .enter()
        .append("rect")
        .attr("class", "bar-men")
        .attr("x", d => x(d.value))
        .attr("y", d => y(d.faixa))
        .attr("width", d => x(0) - x(d.value))
        .attr("height", y.bandwidth())
        .attr("fill", "#4682b4");

  
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Pirâmide Populacional");

   
    const tooltip = d3.select("body").append("div")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "5px 10px")
        .style("border-radius", "5px")
        .style("box-shadow", "0px 0px 10px rgba(0,0,0,0.1)")
        .style("pointer-events", "none")
        .style("display", "none");

    svg.selectAll("rect")
        .on("mouseover", function (event, d) {
            d3.select(this).attr("opacity", 0.8);
            tooltip.style("display", "block")
                .html(`<strong>${d.faixa}</strong><br>Pessoas: ${Math.abs(d.value).toLocaleString()}`);
        })
        .on("mousemove", function (event) {
            tooltip.style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", function () {
            d3.select(this).attr("opacity", 1);
            tooltip.style("display", "none");
        });
   
    const legendData = [
        { label: "Homens", color: "#4682b4" },
        { label: "Mulheres", color: "#ff7f50" }
    ];

    const legend = svg.append("g")
        .attr("transform", `translate(${width -3}, 0)`);

    legendData.forEach((d, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`); 

        legendRow.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", d.color);

        legendRow.append("text")
            .attr("x", 18)
            .attr("y", 10)
            .attr("font-size", "12px")
            .attr("text-anchor", "start")
            .text(d.label);
    });
}


function createGroupedEducationGenderChart(data, selector) {
    const margin = { top: 40, right: 100, bottom: 80, left: 70 }; 
    const width = 400 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(selector)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

  
    const x0 = d3.scaleBand()
        .domain(data.map(d => d.faixa)) 
        .range([0, width])
        .padding(0.2);

    const x1 = d3.scaleBand()
        .domain(data[0].values.map(d => d.group)) 
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d3.max(d.values, v => v.value))]) 
        .nice()
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(data[0].values.map(d => d.group)) 
        .range(d3.schemeSet2); 

   
    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "5px 10px")
        .style("border-radius", "5px")
        .style("box-shadow", "0px 0px 10px rgba(0,0,0,0.1)")
        .style("pointer-events", "none")
        .style("display", "none");

    svg.append("g")
        .selectAll(".age-group")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "age-group")
        .attr("transform", d => `translate(${x0(d.faixa)}, 0)`)
        .selectAll(".bar")
        .data(d => d.values)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x1(d.group))
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", d => color(d.group))
        .on("mouseover", function (event, d) {
            tooltip.style("display", "block")
                .html(`<strong>${d.group}</strong><br>Valor: ${d.value}`);
        })
        .on("mousemove", function (event) {
            tooltip.style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", function () {
            tooltip.style("display", "none");
        });

   
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0))
        .selectAll("text")
        .attr("transform", "rotate(90)") 
        .attr("x", 10) 
        .attr("y", -5) 
        .style("text-anchor", "start"); 

   
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20) 
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Faixas Etárias");

 
    svg.append("g").call(d3.axisLeft(y));


    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", 0 - height / 2)
        .attr("y", 0 - margin.left)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Total");


    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Distribuição por Gênero e Escolaridade");


    const legend = svg.append("g")
        .attr("transform", `translate(${width - 10}, 0)`); 
    data[0].values.forEach((d, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`); 

        legendRow.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", color(d.group));

        legendRow.append("text")
            .attr("x", 18)
            .attr("y", 10)
            .attr("font-size", "12px")
            .attr("text-anchor", "start")
            .text(d.group); 
    });
}


function makeCheckboxesExclusive(containerId) {
    const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]`);

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

            if (checkbox.checked) {
                
                checkboxes.forEach(other => {
                    if (other !== checkbox) {
                        other.checked = false;
                    }
                });
            } else if (checkedCount === 0) {
                
                checkbox.checked = true;
            }

           
            updateChartsWithFilters(true);
        });
    });
}

function makeCheckboxesMultiple(containerId) {
    const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]`);

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            updateChartsWithFilters();
        });
    });
}


makeCheckboxesMultiple("gender-filters");
makeCheckboxesExclusive("education-filters");


function updateChartsWithFilters(isStackChart = false) {
    const { selectedGenders, selectedEducationLevels } = getSelectedFilters();

 
    const filteredData = prepareEducationAndGenderFilteredData(currentChartData, selectedGenders, selectedEducationLevels);

   
    d3.select("#chart-bar").html("");

    createGroupedEducationGenderChart(filteredData, "#chart-bar");


    if (isStackChart) {
        
        const filteredData = prepareEducationStackedData(currentChartData, selectedEducationLevels);
        const filteredData2 = prepareEducationPieChart(currentChartData, selectedEducationLevels);
    
        d3.select("#chart-stacked-bar").html("");

        createStackedBarChart(filteredData, "#chart-stacked-bar");

        d3.select("#chart-donut").html("");

        createDonutChart(filteredData2, "#chart-donut");

        d3.select("#pyramid-svg").html("");

        createPopulationPyramid(filteredData, "#pyramid-svg");
    };
    
}

function getSelectedFilters() {
    const selectedGenders = Array.from(document.querySelectorAll("#gender-filters input:checked")).map(el => el.value);
    const selectedEducationLevels = Array.from(document.querySelectorAll("#education-filters input:checked")).map(el => el.value);

    console.log("Gêneros selecionados:", selectedGenders);
    console.log("Níveis de ensino selecionados:", selectedEducationLevels);

    return { selectedGenders, selectedEducationLevels };
}

function prepareEducationAndGenderFilteredData(data, selectedGenders, selectedEducationLevels, includeAgeRanges = true) {
    const ageRanges = [
        "0:14", "15:19", "20:24", "25:29", "30:34",
        "35:39", "40:44", "45:49", "50:54", "55:59",
        "60:64", "65:69", "70:74", "75+"
    ];

    if (!includeAgeRanges) {
        let total = 0;
        selectedEducationLevels.forEach(level => {
            selectedGenders.forEach(gender => {
                const key = `${gender}-${level}`;
                total += +data[key] || 0;
            });
        });
        return [{ faixa: "Total", total }];
    }

    return ageRanges.map(age => {
        const values = [];
        selectedGenders.forEach(gender => {
            selectedEducationLevels.forEach(level => {
                const key = `${gender}-${age}-${level}`;
                const value = +data[key] || 0;
                values.push({
                    group: `${gender}-${level}`, 
                    value
                });
            });
        });

        return { faixa: age, values }; 
    });
}

function prepareEducationStackedData(data, selectedEducationLevels, includeAgeRanges = true) {
    
    const ageRanges = [
        "0:14", "15:19", "20:24", "25:29", "30:34",
        "35:39", "40:44", "45:49", "50:54", "55:59",
        "60:64", "65:69", "70:74", "75+"
    ];

    const genders = ["H", "M"];

    if (!includeAgeRanges) {
        let homens = 0;
        let mulheres = 0;
        selectedEducationLevels.forEach(level => {
            genders.forEach(gender => {
                ageRanges.forEach(age => {
                    const key = `${gender}-${age}-${level}`;
                    if (gender === "H") {
                        homens += +data[key] || 0;
                    } else if (gender === "M") {
                        mulheres += +data[key] || 0;
                    }
                });
            });
        });
        return [{ faixa: "Total", homens, mulheres }];
    }

    return ageRanges.map(age => {
        let homens = 0;
        let mulheres = 0;
        selectedEducationLevels.forEach(level => {
            genders.forEach(gender => {
                const key = `${gender}-${age}-${level}`;
                if (gender === "H") {
                    homens += +data[key] || 0;
                } else if (gender === "M") {
                    mulheres += +data[key] || 0;
                }
            });
        });
        return { faixa: age, homens, mulheres };
    });
}

function prepareEducationPieChart(data, selectedEducationLevels) {

    const ageRanges = [
        "0:14", "15:19", "20:24", "25:29", "30:34",
        "35:39", "40:44", "45:49", "50:54", "55:59",
        "60:64", "65:69", "70:74", "75+"
    ];
    
    const genders = ["H", "M"];
    let totalHomens = 0;
    let totalMulheres = 0;

    ageRanges.map(age => {
        selectedEducationLevels.forEach(level => {
            genders.forEach(gender => {
                const key = `${gender}-${age}-${level}`;
                if (gender === "H") {
                    totalHomens += +data[key] || 0;
                } else if (gender === "M") {
                    totalMulheres += +data[key] || 0;
                }
            });
        });
    });
    
    console.log("Homens:", totalHomens);
    console.log("Mulheres:", totalMulheres);

    return [
        { label: "Homens", value: totalHomens },
        { label: "Mulheres", value: totalMulheres }
    ];
}

function prepareTop10Data(data, currentFilter) {
 
    console.log("Dados para o top 10:", data);
    
    const sortedData = Object.keys(data)
        .map(location => ({
            location,
            value: data[location][currentFilter] || 0
        }))
        .sort((a, b) => b.value - a.value) 
        .slice(0, 10); 

    return sortedData;
}