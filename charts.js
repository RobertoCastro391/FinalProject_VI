let currentChartData = null;

document.querySelectorAll(".data-filter").forEach(filter => {
    filter.addEventListener("change", () => {
        const selectedFilter = document.querySelector(".data-filter:checked").value;

        if (selectedFilter === "escolaridade") {
            // Exibe os filtros de gênero e escolaridade
            document.getElementById("filters-education").style.display = "block";
            document.getElementById("education-filters").style.display = "block";
        } else {
            // Oculta os filtros caso outro filtro seja selecionado
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
        
        // const donutData = [
        //     { label: "Homens", value: +currentChartData["H"] },
        //     { label: "Mulheres", value: +currentChartData["M"] }
        // ];
        // createDonutChart(donutData, "#chart-donut");

        const filteredData = prepareEducationAndGenderFilteredData(data, selectedGenders, selectedEducationLevels);
        const filteredData2 = prepareEducationStackedData(data, selectedEducationLevels);
        
        d3.select("#chart-bar").html("");
        createGroupedEducationGenderChart(filteredData, "#chart-bar");
        
        d3.select("#chart-stacked-bar").html("");
        createStackedBarChart(filteredData2, "#chart-stacked-bar");
        
        return; // Finaliza aqui para evitar renderizar outros gráficos
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

    createBarChart(barData, "#chart-bar");
    createDonutChart(donutData, "#chart-donut");
    createStackedBarChart(stackedData, "#chart-stacked-bar");
    createPopulationPyramid(pyramidData, "#pyramid-svg");
}


function createBarChart(data, selector) {
    const margin = { top: 40, right: 30, bottom: 50, left: 70 };
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
        .attr("y", - margin.left)
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

export function createPopulationPyramid(data) {
    const margin = { top: 20, right: 30, bottom: 50, left: 80 }; // Ajuste no left para espaço das legendas
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Seleciona o contêiner e limpa seu conteúdo
    const container = d3.select("#pyramid-svg");
    container.html(""); // Limpa o contêiner antes de renderizar o gráfico

    // Cria o SVG dentro do contêiner
    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Processa os dados para homens e mulheres
    const men = data.map(d => ({ faixa: d.faixa, value: -d.homens }));
    const women = data.map(d => ({ faixa: d.faixa, value: d.mulheres }));

    // Escalas
    const x = d3.scaleLinear()
        .domain([-d3.max(men, d => Math.abs(d.value)), d3.max(women, d => d.value)])
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(data.map(d => d.faixa))
        .range([height, 0])
        .padding(0.1);

    // Adiciona os eixos
    svg.append("g")
        .call(d3.axisLeft(y).tickSize(0)) // Remove as marcas no eixo
        .selectAll("text")
        .attr("dy", y.bandwidth() / 2) // Centraliza verticalmente
        .style("text-anchor", "middle") // Centraliza horizontalmente
        .attr("transform", `translate(-30,0)`); // Move o texto para o meio do gráfico

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d => Math.abs(d)));

    // Barras para mulheres
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

    // Barras para homens
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

    // Adiciona título ao gráfico
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Pirâmide Populacional");

    // Adiciona tooltips
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
}


function createGroupedEducationGenderChart(data, selector) {
    const margin = { top: 40, right: 30, bottom: 50, left: 70 };
    const width = 400 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    const svg = d3.select(selector)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X and Y scales
    const x0 = d3.scaleBand()
        .domain(data.map(d => d.faixa)) // Main groups (age ranges)
        .range([0, width])
        .padding(0.2);

    const x1 = d3.scaleBand()
        .domain(data[0].values.map(d => d.group)) // Subgroups (gender + education)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d3.max(d.values, v => v.value))]) // Max value across groups
        .nice()
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(data[0].values.map(d => d.group)) // Subgroup names
        .range(d3.schemeSet2); // Use a color scheme

    // Tooltip
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

    // Render bars
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

    // X-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0));

    // Y-axis
    svg.append("g").call(d3.axisLeft(y));

    // Chart title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Distribuição por Gênero e Escolaridade");
}

// Make checkboxes mutually exclusive but ensure at least one remains selected
function makeCheckboxesExclusive(containerId) {
    const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]`);

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

            if (checkbox.checked) {
                // Uncheck all other checkboxes in the group
                checkboxes.forEach(other => {
                    if (other !== checkbox) {
                        other.checked = false;
                    }
                });
            } else if (checkedCount === 0) {
                // Prevent the last checkbox from being deselected
                checkbox.checked = true;
            }

            // Trigger filter update if needed
            updateChartsWithFilters(isStackChart);
        });
    });
}

function makeCheckboxesMultiple(containerId) {
    const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]`);

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            // Trigger filter update when any checkbox is changed
            updateChartsWithFilters();
        });
    });
}

// Attach the mutual exclusivity behavior to each filter group
makeCheckboxesMultiple("gender-filters");
makeCheckboxesExclusive("education-filters");

// Function to update charts dynamically
function updateChartsWithFilters(isStackChart = false) {
    const { selectedGenders, selectedEducationLevels } = getSelectedFilters();

    // Prepare filtered data
    const filteredData = prepareEducationAndGenderFilteredData(currentChartData, selectedGenders, selectedEducationLevels);

    // Clear existing chart
    d3.select("#chart-bar").html("");

    // Re-render the chart with filtered data
    createGroupedEducationGenderChart(filteredData, "#chart-bar");


    if (isStackChart) {
        console.log("Entrei aqui")
        console.log(selectedEducationLevels)
        const filteredData = prepareEducationStackedData(currentChartData, selectedEducationLevels);
        // Clear existing chart
        d3.select("#chart-stacked-bar").html("");

        // Re-render the chart with filtered data
        createStackedBarChart(filteredData, "#chart-stacked-bar");
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
                    group: `${gender}-${level}`, // Combine gender and education level
                    value
                });
            });
        });

        console.log({ faixa: age, values });

        return { faixa: age, values }; // Grouped by age range
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
        // Aggregate data across all age ranges
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

    // Aggregate data for each age range
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