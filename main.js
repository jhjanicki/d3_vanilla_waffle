// get list of unique categories from redlistCategory attribute
let categories = data.map(obj => obj.redlistCategory);
categories = [... new Set(categories)]

// or if there is a manual order can do the following
const categoriesSorted = ["Critically Endangered", "Endangered", "Vulnerable", "Near Threatened", "Least Concern", "Data Deficient"];

const colorScale = d3.scaleOrdinal().domain(categoriesSorted).range(["#b30000", "#e34a33", "#fc8d59", "#fdbb84", "#fdd49e", "#d9d9d9"]);


const  sumSortWaffleData = (data) => {

    //summarise data & calculate ratio & raw count for each category
    const rolledData = data.map((entry) =>
        d3.map(
            d3.rollup(data, v => v.length, d => d.redlistCategory),
            ([category, result]) => ({
                category: category,
                ratio: (result / data.length) * 100,
                quantity: result,
            })
        )
    )[0]

    // sort the data based on the order of categoriesSorted
    const order = {}; // map for efficient lookup of sortIndex
    for (let i = 0; i < categoriesSorted.length; i++){
        order[categoriesSorted[i]] = i;
    }
        
    return rolledData.sort( (a, b) =>(order[a.category] - order[b.category]));
}

const createWaffleData = (data) => {
    const array = [];
    const max = data.length - 1;
    let index = 0,
        curr = 1,
        accu = Math.round(data[0].ratio),
        waffle = [],
        category = "",
        ratio = "",
        labelX = 0,
        labelY = 0;

    for (let y = 0; y < 10; y++)
        for (let x = 0; x < 10; x++) {
            if (curr > accu && index < max) {
                let r = Math.round(data[++index].ratio);
                while (r === 0 && index < max) r = Math.round(data[++index].ratio);
                accu += r;
                labelX = x;
                labelY = y;
            }
            category = data[index].category;
            ratio = data[index].ratio.toFixed(0);
            waffle.push({
                x,
                y,
                index,
                ratio,
                category,
                label: [labelX, labelY]
            });
            curr++;
        }
    array.push(waffle);
    return array;
}

//final dataset
const waffleDataSummed = sumSortWaffleData(data);
const waffleData = createWaffleData(waffleDataSummed);

// all variables related to dimensions

const length = 400;
const marginLength = 30;

const categoryHeight = 20;
const legendPadding = 20;
const legendHeight = categoryHeight*categoriesSorted.length;

const margin = {
    "top": marginLength ,
    "left": marginLength,
    "bottom": marginLength,
    "right": marginLength 
}

const unitDimension = 10;

//create SVG & G
const svg = d3.select("#chart").append("svg").attr("width", length + margin.left + margin.right).attr("height", length + margin.top + margin.bottom + legendHeight );

const chartG = svg.append("g").attr("class", "chartWrapper")
    .attr("transform", `translate(${margin.left},${margin.top})`)

const legendG = svg.append("g").attr("class", "legendWrapper")
    .attr("transform", `translate(${margin.left}, ${margin.top + legendPadding + length})`)

// add all units & text
chartG.selectAll(`rect.unit`)
    .data(waffleData[0])
    .join("rect")
    .attr("class", `unit`)
    .attr("x", d => d.x * length / unitDimension)
    .attr("y", d => d.y * length / unitDimension)
    .attr("width", d => length / unitDimension)
    .attr("height", d => length / unitDimension)
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .attr("fill", d => colorScale(d.category));

chartG.selectAll(`text.label`)
    .data(waffleData[0])
    .join("text")
    .attr("class", `label`)
    .attr("x", d => (d.label[0] * length) / unitDimension)
    .attr("y", d => (d.label[1] * length) / unitDimension)
    .attr("dx", d => d.ratio > 9 ? 5 : 9)
    .attr("dy", d => length / unitDimension / 1.6)
    .attr("fill", "white")
    .text(d => `${d.ratio}%`);

// add legend    
const legend = legendG.selectAll("g.legendG")
    .data(waffleDataSummed)
    .join("g")
    .attr("class","legendG")
    .attr("transform", (d,i) => `translate(0,${i*categoryHeight})`);

    legend.append("text").text(d=>d.category)
    .attr("transform", "translate(15,9)"); //align texts with boxes

    legend.append("rect")
    .attr("fill", d=>colorScale(d.category))
    .attr("width", 10)
    .attr("height", 10);

