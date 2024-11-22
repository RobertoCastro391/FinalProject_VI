import { createCharts } from './charts.js';

// Variável para armazenar o filtro atual
let currentFilter = "populacao"; // Filtro padrão

// Listener para capturar mudanças no filtro selecionado
document.querySelectorAll(".data-filter").forEach(filter => {
    filter.addEventListener("change", function () {
        currentFilter = this.value; // Atualiza o filtro atual
        const codigo = document.querySelector(".local-item.active")?.getAttribute("data-codigo");
        const ano = document.getElementById("ano-select").value;
        if (codigo && ano) {
            loadPopulationData(codigo, ano); // Recarrega os dados com o filtro selecionado
        }
    });
});

// Carrega os dados dos locais e configura o comportamento das seleções
d3.json("./DataSets/locais.json").then(locaisData => {
    const partes = locaisData.Partes || [];

    const zonaSelect = d3.select("#zona-select");
    partes.forEach(parte => {
        zonaSelect.append("option")
            .attr("value", parte.Codigo)
            .text(parte.Local);
    });

    const regiaoSelect = d3.select("#regiao-select");
    const municipioSelect = d3.select("#municipio-select");

    zonaSelect.on("change", function () {
        const selectedParte = partes.find(p => p.Codigo === this.value);

        if (selectedParte) {
            const zonas = selectedParte.Zonas || [];
            regiaoSelect.selectAll("option:not(:first-child)").remove();
            regiaoSelect.property("disabled", zonas.length === 0);

            zonas.forEach(zona => {
                regiaoSelect.append("option")
                    .attr("value", zona.Codigo)
                    .text(zona.Local);
            });

            municipioSelect.property("disabled", true);
            drawLocais(zonas);
        } else {
            regiaoSelect.property("disabled", true);
            municipioSelect.property("disabled", true);
            drawLocais(partes);
        }
    });

    regiaoSelect.on("change", function () {
        const selectedParte = partes.find(p => p.Codigo === zonaSelect.property("value"));
        const selectedZona = selectedParte?.Zonas.find(z => z.Codigo === this.value);

        if (selectedZona) {
            const regioes = selectedZona.Regioes || [];
            municipioSelect.selectAll("option:not(:first-child)").remove();
            municipioSelect.property("disabled", regioes.length === 0);

            regioes.forEach(regiao => {
                municipioSelect.append("option")
                    .attr("value", regiao.Codigo)
                    .text(regiao.Nome);
            });

            drawLocais(regioes);
        } else {
            municipioSelect.property("disabled", true);
            drawLocais([]);
        }
    });

    municipioSelect.on("change", function () {
        const selectedParte = partes.find(p => p.Codigo === zonaSelect.property("value"));
        const selectedZona = selectedParte?.Zonas.find(z => z.Codigo === regiaoSelect.property("value"));
        const selectedRegiao = selectedZona?.Regioes.find(r => r.Codigo === this.value);

        if (selectedRegiao) {
            const municipios = selectedRegiao.Municipios || [];
            drawLocais(municipios);
        } else {
            drawLocais([]);
        }
    });

    function drawLocais(locais) {
        const locaisContainer = d3.select("#locais-container");
        locaisContainer.html(""); // Limpa os cartões existentes
    
        locais.forEach(local => {
            const card = locaisContainer.append("div")
                .attr("class", "card mb-3 local-item")
                .attr("data-codigo", local.Codigo)
                .on("click", function () {
                    const codigo = d3.select(this).attr("data-codigo");
                    const ano = document.getElementById("ano-select").value;
    
                    // Define o local ativo
                    d3.selectAll(".local-item").classed("active", false);
                    d3.select(this).classed("active", true);
    
                    if (codigo && ano) {
                        loadPopulationData(codigo, ano); // Atualiza os dados
                    }
                });
    
            // Apenas preenche o título do cartão
            card.append("div")
                .attr("class", "card-body")
                .append("h5")
                .attr("class", "card-title")
                .text(local.Local || local.Nome);
        });
    }
    
    
    drawLocais(partes);
}).catch(error => {
    console.error("Erro ao carregar os dados:", error);
    alert("Erro ao carregar os dados. Verifique se os arquivos estão acessíveis.");
});

// Função para carregar os dados e atualizar os gráficos
// Função para carregar os dados e atualizar os gráficos
function loadPopulationData(codigo, ano) {
    // Define o diretório correto para cada filtro
    let directory = "População";
    let file="população_residente";
    if (currentFilter === "escolaridade") {
        directory = "Escolaridade";
        file="nivel_de_escolaridade";
    } else if (currentFilter === "desemprego") {
        directory = "Desemprego";
        file="desempregados";
    }

    // Caminho do arquivo CSV baseado no filtro e ano
    const csvFile = `./DataSets/${directory}/${file}_${ano}.csv`;

    console.log(`Carregando dados do arquivo: ${csvFile}`); // Log para debug

    d3.dsv(";", csvFile).then(data => {
        const selectedData = data.find(row => row["Codigo"] === codigo);

        if (selectedData) {
            createCharts(selectedData); // Atualiza os gráficos com os dados
        } else {
            document.getElementById('visualization').innerHTML = '<p>Nenhum dado encontrado para o código informado.</p>';
        }
    }).catch(error => {
        console.error(`Erro ao carregar o arquivo CSV: ${error}`);
        document.getElementById('visualization').innerHTML = '<p>Erro ao carregar os dados. Verifique se o arquivo está acessível e formatado corretamente.</p>';
    });
}
