    export function createCharts(data) {
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

        d3.select("#chart-bar").html("");
        d3.select("#chart-donut").html("");
        d3.select("#chart-stacked-bar").html("");

        createBarChart(barData, "#chart-bar");
        createDonutChart(donutData, "#chart-donut");
        createStackedBarChart(stackedData, "#chart-stacked-bar");
    }

    function createBarChart(data, selector) {
        const margin = { top: 20, right: 30, bottom: 50, left: 50 };
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

        // Tooltip para exibir valores ao passar o mouse
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
                d3.select(this).attr("fill", "#3385cc"); // Destaca a barra
                tooltip.style("display", "block")
                    .html(`<strong>${d.faixa}</strong><br>Total: ${d.total.toLocaleString()}`);
            })
            .on("mousemove", function (event) {
                tooltip.style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY - 20 + "px");
            })
            .on("mouseout", function () {
                d3.select(this).attr("fill", "#66b3ff"); // Restaura a cor
                tooltip.style("display", "none");
            });

        // Eixo X
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Eixo Y
        svg.append("g")
            .call(d3.axisLeft(y));

        // Rótulo do Eixo Y
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - height / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("População Total");

        // Título do Gráfico
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 0 - margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("text-decoration", "underline")
            .text("Distribuição por Faixa Etária");
    }


    function createDonutChart(data, selector) {
        const width = 300; // Mantém o donut centralizado
        const height = 300;
        const radius = Math.min(width, height) / 2;

    
        const svg = d3.select(selector)
            .append("svg")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);
    
        const color = d3.scaleOrdinal()
            .domain(data.map(d => d.label))
            .range(["#4682b4", "#ff7f50"]);
    
        const pie = d3.pie().value(d => d.value);
        const arc = d3.arc().innerRadius(radius - 70).outerRadius(radius);
    
        const hoverArc = d3.arc().innerRadius(radius - 70).outerRadius(radius + 10);
    
        const totalPessoas = data.reduce((sum, d) => sum + d.value, 0); // Soma total
    
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
                        `Total: ${d.data.value.toLocaleString()}<br>`
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
    }
    


    function createStackedBarChart(data, selector) {
        const margin = { top: 20, right: 30, bottom: 50, left: 50 };
        const width = 400; // Altere para melhorar
        const height = 300;

    
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
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
    
        svg.append("g").call(d3.axisLeft(y));
    }
    