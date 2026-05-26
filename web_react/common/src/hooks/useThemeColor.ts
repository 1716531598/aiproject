import { PRIMARY_COLOR, THEME } from '@/constant/theme';
import { useEffect, useState } from 'react';

const COLORS = {
  default: {
    fontColor: 'rgba(0, 0, 0, 0.85)',
    secfontColor: 'rgba(0,0,0,0.5)',
    blue: '#1890ff',
    lakeGreen: '#5DDECF',
    green: '#2FC25B',
    yellow: '#facc14',
    red: '#f04864',
    purple: '#8543e0',
  },
  customize: {
    fontColor: 'rgba(0, 0, 0, 0.85)',
    secfontColor: 'rgba(0,0,0,0.5)',
    blue: PRIMARY_COLOR,
    lakeGreen: '#36cbcb',
    green: '#07ae39ff',
    yellow: '#FAC858',
    red: '#be2329ff',
    purple: '#9860e7ff',
  },
  night: {
    fontColor: 'rgba(199, 221, 255, 0.85)',
    secfontColor: 'rgba(199, 221, 255, 0.5)',
    blue: PRIMARY_COLOR,
    lakeGreen: '#36cbcb',
    green: '#07ae39ff',
    yellow: '#FAC858',
    red: '#be2329ff',
    purple: '#9860e7ff',
  },
};

const setHtmlTheme = (theme: 'light' | 'dark') => {
  const html = document.documentElement;
  html.setAttribute('data-theme', theme);
};

export const loadThemeColor = () => {
  const savedTheme = localStorage.getItem('app-theme') || 'webray';
  return COLORS[THEME[savedTheme]?.colors] || COLORS.customize;
};
