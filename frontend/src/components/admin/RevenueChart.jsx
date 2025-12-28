import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js/auto";
import { Bar } from "react-chartjs-2";
import { getToken } from "../../utls";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function RevenueChart() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRevenueTrend = async () => {
      try {
        const token = getToken();
        const response = await fetch(
          "http://127.0.0.1:8000/api/admin/revenue-trend/",
          {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          
          // Format data for Chart.js
          const labels = data.map((item) => item.date);
          const revenues = data.map((item) => item.revenue);

          setChartData({
            labels,
            datasets: [
              {
                label: "Daily Revenue (\$)",
                data: revenues,
                backgroundColor: "rgba(91, 101, 220, 0.8)",
                borderColor: "rgba(91, 101, 220, 1)",
                borderWidth: 2,
                borderRadius: 6,
                hoverBackgroundColor: "rgba(76, 85, 194, 0.9)",
              },
            ],
          });
        } else {
          throw new Error("Failed to fetch revenue trend");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueTrend();
  }, []);

  if (loading) {
    return (
      <div className="chart-container">
        <h3>Revenue Trend (Last 5 Days)</h3>
        <div className="chart-loading">
          <div className="spinner"></div>
          <p>Loading chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-container">
        <h3>Revenue Trend (Last 5 Days)</h3>
        <div className="chart-error">
          <p>Error loading chart: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3>Revenue Trend (Last 5 Days)</h3>
      {chartData && (
        <div className="chart-wrapper">
          <Bar
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: undefined,
              plugins: {
                legend: {
                  display: true,
                  position: "top",
                  labels: {
                    color: "#6b7280",
                    font: {
                      size: 12,
                      weight: "500",
                    },
                    padding: 12,
                  },
                },
                title: {
                  display: false,
                },
                tooltip: {
                  enabled: true,
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  titleColor: "#fff",
                  bodyColor: "#fff",
                  padding: 10,
                  borderRadius: 6,
                  titleFont: { size: 13, weight: "bold" },
                  bodyFont: { size: 12 },
                  callbacks: {
                    label: function (context) {
                      return `Revenue: $${context.parsed.y.toFixed(2)}`;
                    },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    color: "#6b7280",
                    font: { size: 11 },
                    callback: function (value) {
                      return "$" + value.toFixed(0);
                    },
                  },
                  grid: {
                    color: "rgba(229, 231, 235, 0.5)",
                    drawBorder: false,
                  },
                },
                x: {
                  ticks: {
                    color: "#6b7280",
                    font: { size: 11 },
                  },
                  grid: {
                    display: false,
                  },
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
}
