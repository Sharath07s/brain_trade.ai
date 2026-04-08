import React, { useEffect, useRef } from 'react';
import { createChart, type IChartApi, type ISeriesApi } from 'lightweight-charts';

export interface ChartData {
    time: string | number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface TradingViewChartProps {
    data: ChartData[];
    liveTickPrice?: number | null;
    colors?: {
        backgroundColor?: string;
        lineColor?: string;
        textColor?: string;
    };
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
    data,
    liveTickPrice = null,
    colors: {
        backgroundColor = 'transparent',
        textColor = '#8892b0',
    } = {},
}) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const mainSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
    
    // State trackers for live updates
    const prevFirstTimeRef = useRef<string | number | null>(null);
    const lastCandleRef = useRef<any>(null);
    const lastVolumeRef = useRef<any>(null);

    // Initialization Effect: Creates the chart instance ONLY once (or when theme colors change)
    useEffect(() => {
        if (!chartContainerRef.current) return;

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
                mode: 0 as any, // CrosshairMode.Normal
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                timeVisible: true, // We will toggle this dynamically in the data effect
                secondsVisible: false,
            },
        });
        
        const mainSeries = chart.addCandlestickSeries({
            upColor: '#00ff88',
            downColor: '#ff3366',
            borderVisible: false,
            wickUpColor: '#00ff88',
            wickDownColor: '#ff3366',
        });
        
        const volumeSeries = chart.addHistogramSeries({
            color: '#1f2937',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '', // set as an overlay
        });
        
        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });

        // Tooltip logic
        chart.subscribeCrosshairMove((param) => {
            if (!tooltipRef.current) return;
            
            if (
                param.point === undefined ||
                !param.time ||
                param.point.x < 0 ||
                param.point.x > chartContainerRef.current!.clientWidth ||
                param.point.y < 0 ||
                param.point.y > chartContainerRef.current!.clientHeight
            ) {
                tooltipRef.current.style.display = 'none';
                return;
            }

            const dataPoint = param.seriesData.get(mainSeries) as any;
            const volPoint = param.seriesData.get(volumeSeries) as any;
            
            if (dataPoint) {
                tooltipRef.current.style.display = 'block';
                const open = dataPoint.open.toFixed(2);
                const high = dataPoint.high.toFixed(2);
                const low = dataPoint.low.toFixed(2);
                const close = dataPoint.close.toFixed(2);
                const vol = volPoint ? (volPoint.value >= 1e6 ? (volPoint.value / 1e6).toFixed(2) + 'M' : volPoint.value >= 1e3 ? (volPoint.value / 1e3).toFixed(2) + 'K' : volPoint.value) : '0';
                
                let timeStr = '';
                if (typeof param.time === 'string') {
                    timeStr = param.time;
                } else if (typeof param.time === 'number') {
                    const d = new Date(param.time * 1000);
                    timeStr = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
                }

                tooltipRef.current.innerHTML = `
                    <div style="font-size: 12px; margin-bottom: 4px; color: ${textColor}">${timeStr}</div>
                    <div style="font-size: 13px; font-weight: bold; color: white;">
                        O: <span style="color: ${open <= close ? '#00ff88' : '#ff3366'}">${open}</span>
                        H: <span style="color: ${textColor}">${high}</span>
                        L: <span style="color: ${textColor}">${low}</span>
                        C: <span style="color: ${open <= close ? '#00ff88' : '#ff3366'}">${close}</span>
                    </div>
                    <div style="font-size: 12px; color: ${textColor}; margin-top: 2px;">Vol: ${vol}</div>
                `;
            }
        });

        chartRef.current = chart;
        mainSeriesRef.current = mainSeries;
        volumeSeriesRef.current = volumeSeries;

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            chartRef.current = null;
            mainSeriesRef.current = null;
            volumeSeriesRef.current = null;
            prevFirstTimeRef.current = null; // Critical: Reset this on unmount so new chart instances get full setData instead of missing history
        };
    }, [backgroundColor, textColor]); // Notice `data` is intentionally excluded here

    // Data Update Effect: Runs when historical `data` changes
    useEffect(() => {
        if (!chartRef.current || !mainSeriesRef.current || !volumeSeriesRef.current || !data || data.length === 0) return;
        
        const sortedData = [...data].sort((a, b) => {
            const timeA = typeof a.time === 'number' ? a.time : new Date(a.time).getTime();
            const timeB = typeof b.time === 'number' ? b.time : new Date(b.time).getTime();
            return timeA - timeB;
        });

        const isIntraday = typeof sortedData[0].time === 'number';
        chartRef.current.applyOptions({
            timeScale: { timeVisible: isIntraday },
        });

        const candleData = sortedData.map(item => ({
            time: item.time as any,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
        }));

        const volumeData = sortedData.map(item => ({
            time: item.time as any,
            value: item.volume,
            color: item.close >= item.open ? '#00ff8840' : '#ff336640',
        }));

        const currentFirstTime = candleData[0].time;

        // If it's a completely new dataset (changed symbol, changed timeframe, or fresh mount)
        if (prevFirstTimeRef.current !== currentFirstTime || prevFirstTimeRef.current === null) {
            mainSeriesRef.current.setData(candleData);
            volumeSeriesRef.current.setData(volumeData);
            
            // Only fit content on first load to allow user to pan/zoom later //
            setTimeout(() => {
                if (chartRef.current) {
                    chartRef.current.timeScale().fitContent();
                }
            }, 50);
        } else {
            // Soft update: normally not hit aggressively since we use WebSocket but falls back to this
            mainSeriesRef.current.update(candleData[candleData.length - 1]);
            volumeSeriesRef.current.update(volumeData[volumeData.length - 1]);
        }

        prevFirstTimeRef.current = currentFirstTime;
        lastCandleRef.current = candleData[candleData.length - 1];
        lastVolumeRef.current = volumeData[volumeData.length - 1];

    }, [data]);

    // WebSocket Live Tick Effect: Appends or modifies chart without reloading history array!
    useEffect(() => {
        if (!liveTickPrice || !mainSeriesRef.current || !volumeSeriesRef.current || !lastCandleRef.current) return;
        
        const currentLast = lastCandleRef.current;
        const currentVol = lastVolumeRef.current;

        // Create an updated candle
        const updatedCandle = {
            time: currentLast.time,
            open: currentLast.open,
            high: Math.max(currentLast.high, liveTickPrice),
            low: Math.min(currentLast.low, liveTickPrice),
            close: liveTickPrice,
        };

        // Determine volume color
        const isBullish = liveTickPrice >= currentLast.open;
        const updatedVol = {
            time: currentVol.time,
            value: currentVol.value + 1, // artificially inflate volume on ticks for visual activity
            color: isBullish ? '#00ff8840' : '#ff336640',
        };

        // Update chart instances
        mainSeriesRef.current.update(updatedCandle);
        volumeSeriesRef.current.update(updatedVol);
        
        // Update local refs
        lastCandleRef.current = updatedCandle;
        lastVolumeRef.current = updatedVol;

    }, [liveTickPrice]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div 
                ref={tooltipRef} 
                style={{ 
                    position: 'absolute', 
                    display: 'none', 
                    padding: '8px', 
                    boxSizing: 'border-box', 
                    fontSize: '12px', 
                    textAlign: 'left', 
                    zIndex: 1000, 
                    top: '12px', 
                    left: '12px', 
                    pointerEvents: 'none', 
                    background: 'rgba(0, 0, 0, 0.7)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    backdropFilter: 'blur(4px)'
                }} 
            />
            <div 
                ref={chartContainerRef} 
                style={{ width: '100%', height: '100%', minHeight: '350px' }} 
            />
        </div>
    );
};

export default TradingViewChart;
