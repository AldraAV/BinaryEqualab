import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';

interface PlateletsGraphProps {
    data: any;
    loading: boolean;
}

const PlateletsGraph: React.FC<PlateletsGraphProps> = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="w-full h-80 flex items-center justify-center bg-white/5 rounded-2xl animate-pulse">
                <span className="text-aurora-muted">Procesando simulación en EquaCore C++...</span>
            </div>
        );
    }

    if (!data || !data.t) return null;

    // Formatear datos para Recharts
    const chartData = data.t.map((time: number, index: number) => ({
        day: Math.floor(time),
        platelets: data.y[index][0],
        antibodies: data.y[index][1] * 10000 // Escala para visualización
    }));

    return (
        <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorPlat" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff6b00" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ff6b00" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis 
                        dataKey="day" 
                        stroke="#666" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        label={{ value: 'Días', position: 'insideBottomRight', offset: -10, fill: '#666' }}
                    />
                    <YAxis 
                        stroke="#666" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        domain={[0, 'auto']}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1614', borderColor: '#333', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#ff6b00' }}
                    />
                    
                    {/* Umbral Crítico (30k) */}
                    <ReferenceLine y={30000} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Crítico', fill: '#ef4444', fontSize: 10 }} />
                    
                    {/* Umbral Normal (150k) */}
                    <ReferenceLine y={150000} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Normal', fill: '#10b981', fontSize: 10 }} />

                    <Area 
                        type="monotone" 
                        dataKey="platelets" 
                        stroke="#ff6b00" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorPlat)" 
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PlateletsGraph;
