import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export interface ChartData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface TradingViewChartProps {
    data: ChartData[];
    colors?: {
        backgroundColor?: string;
        lineColor?: string;
        textColor?: string;
    };
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
    data,
    colors: {
        backgroundColor = 'transparent',
        textColor = '#8892b0',
    } = {},
}) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);

    useEffect(() => {
        if (!chartContainerRef.current || !data || data.length === 0) return;
        
        // Ensure data is sorted by time chronologically
        const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Format data
        const candleData = sortedData.map(item => ({
            time: item.date,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
        }));

        const volumeData = sortedData.map(item => ({
            time: item.date,
            value: item.volume,
            color: item.close >= item.open ? '#00ff8840' : '#ff336640',
        }));

        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: 'solid' as any, color: backgroundColor },
                textColor,
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight || 350,
            crosshair: {
                mode: 0 as any, // CrosshairMode.Normal is 0
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                timeVisible: false,
            },
        });
        
        chartRef.current = chart;

        const mainSeries = chart.addCandlestickSeries({
            upColor: '#00ff88',
            downColor: '#ff3366',
            borderVisible: false,
            wickUpColor: '#00ff88',
            wickDownColor: '#ff3366',
        });
        mainSeries.setData(candleData);

        const volumeSeries = chart.addHistogramSeries({
            color: '#1f2937',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '', // set as an overlay
        });
        
        // Scale volume to bottom 20%
        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });
        volumeSeries.setData(volumeData);

        // Fit content elegantly
        chart.timeScale().fitContent();

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                chartRef.current.remove();
            }
        };
    }, [data, backgroundColor, textColor]);

    return (
        <div 
            ref={chartContainerRef} 
            style={{ width: '100%', height: '100%', minHeight: '350px' }} 
        />
    );
};

export default TradingViewChart;
