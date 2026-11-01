import React from 'react';

/**
 * Returns an icon and background accent based on transaction description or type
 */
export function getCategoryMeta(description = '', tipo = 1) {
  const desc = description.toLowerCase().trim();

  if (desc.includes('spotify') || desc.includes('musica') || desc.includes('music')) {
    return {
      icon: <i className="fab fa-spotify" style={{ color: '#1DB954' }}></i>,
      name: 'Entretenimiento'
    };
  }
  if (desc.includes('adobe') || desc.includes('software') || desc.includes('figma') || desc.includes('suscripcion')) {
    return {
      icon: <i className="fab fa-adobe" style={{ color: '#FF0000' }}></i>,
      name: 'Software'
    };
  }
  if (desc.includes('netflix') || desc.includes('disney') || desc.includes('hbo') || desc.includes('cine')) {
    return {
      icon: <i className="fas fa-film" style={{ color: '#E50914' }}></i>,
      name: 'Streaming'
    };
  }
  if (desc.includes('comida') || desc.includes('restaurante') || desc.includes('almuerzo') || desc.includes('cena') || desc.includes('uber eats')) {
    return {
      icon: <i className="fas fa-utensils" style={{ color: '#FF8A65' }}></i>,
      name: 'Alimentación'
    };
  }
  if (desc.includes('super') || desc.includes('mercado') || desc.includes('despensa') || desc.includes('compras')) {
    return {
      icon: <i className="fas fa-shopping-basket" style={{ color: '#F59E0B' }}></i>,
      name: 'Supermercado'
    };
  }
  if (desc.includes('gasolina') || desc.includes('uber') || desc.includes('taxi') || desc.includes('transporte') || desc.includes('combustible')) {
    return {
      icon: <i className="fas fa-car-side" style={{ color: '#3B82F6' }}></i>,
      name: 'Transporte'
    };
  }
  if (desc.includes('sueldo') || desc.includes('salario') || desc.includes('pago') || desc.includes('nomina') || desc.includes('honorarios')) {
    return {
      icon: <i className="fas fa-coins" style={{ color: '#4E44EB' }}></i>,
      name: 'Ingreso Nómina'
    };
  }
  if (desc.includes('banco') || desc.includes('transferencia') || desc.includes('deposito') || desc.includes('tatra')) {
    return {
      icon: <i className="fas fa-university" style={{ color: '#4E44EB' }}></i>,
      name: 'Bancario'
    };
  }
  if (desc.includes('internet') || desc.includes('luz') || desc.includes('agua') || desc.includes('telefono') || desc.includes('servicio')) {
    return {
      icon: <i className="fas fa-bolt" style={{ color: '#8B5CF6' }}></i>,
      name: 'Servicios'
    };
  }
  if (desc.includes('salud') || desc.includes('farmacia') || desc.includes('medico') || desc.includes('doctor')) {
    return {
      icon: <i className="fas fa-heartbeat" style={{ color: '#EC4899' }}></i>,
      name: 'Salud'
    };
  }

  // Fallback by tipo (1 = Egreso, 2 = Ingreso)
  if (tipo === 2) {
    return {
      icon: <i className="fas fa-arrow-down" style={{ color: '#4E44EB' }}></i>,
      name: 'Ingreso'
    };
  }

  return {
    icon: <i className="fas fa-receipt" style={{ color: '#FF8A65' }}></i>,
    name: 'Gasto'
  };
}

