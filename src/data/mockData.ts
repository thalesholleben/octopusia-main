import { FinanceRecord, AIAlert } from '@/types/financial';

// Generate mock financial data with more realistic dates
const generateDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

// Generate data for last 6 months
const generateMonthlyData = () => {
  const records: FinanceRecord[] = [];
  let id = 1;

  for (let monthsAgo = 0; monthsAgo < 6; monthsAgo++) {
    const baseDay = monthsAgo * 30;

    // Entradas do mes
    records.push(
      { id: String(id++), userId: '554899999999', valor: 5500 + Math.random() * 2000, de: 'Cliente ABC', para: 'Conta Principal', tipo: 'entrada', categoria: 'Site', dataComprovante: generateDate(baseDay + 2), createdAt: new Date().toISOString() },
      { id: String(id++), userId: '554899999999', valor: 3200 + Math.random() * 1000, de: 'Projeto X', para: 'Conta Principal', tipo: 'entrada', categoria: 'Automacao', dataComprovante: generateDate(baseDay + 8), createdAt: new Date().toISOString() },
      { id: String(id++), userId: '554899999999', valor: 1800 + Math.random() * 800, de: 'Logo Design', para: 'Conta Principal', tipo: 'entrada', categoria: 'Design', dataComprovante: generateDate(baseDay + 15), createdAt: new Date().toISOString() },
      { id: String(id++), userId: '554899999999', valor: 2500 + Math.random() * 1500, de: 'Cliente DEF', para: 'Conta Principal', tipo: 'entrada', categoria: 'Site', dataComprovante: generateDate(baseDay + 22), createdAt: new Date().toISOString() },
    );

    // Saidas do mes
    records.push(
      { id: String(id++), userId: '554899999999', valor: 1500, de: 'Conta Principal', para: 'Proprietario', tipo: 'saida', categoria: 'Aluguel', dataComprovante: generateDate(baseDay + 1), createdAt: new Date().toISOString() },
      { id: String(id++), userId: '554899999999', valor: 450 + Math.random() * 100, de: 'Conta Principal', para: 'CPFL', tipo: 'saida', categoria: 'Contas Fixas', dataComprovante: generateDate(baseDay + 3), createdAt: new Date().toISOString() },
      { id: String(id++), userId: '554899999999', valor: 800 + Math.random() * 300, de: 'Conta Principal', para: 'Supermercado', tipo: 'saida', categoria: 'Alimentacao', dataComprovante: generateDate(baseDay + 5), createdAt: new Date().toISOString() },
      { id: String(id++), userId: '554899999999', valor: 120 + Math.random() * 80, de: 'Conta Principal', para: 'iFood', tipo: 'saida', categoria: 'FastFood', dataComprovante: generateDate(baseDay + 7), createdAt: new Date().toISOString() },
      { id: String(id++), userId: '554899999999', valor: 350 + Math.random() * 150, de: 'Conta Principal', para: 'Uber/99', tipo: 'saida', categoria: 'Transporte', dataComprovante: generateDate(baseDay + 10), createdAt: new Date().toISOString() },
      { id: String(id++), userId: '554899999999', valor: 280 + Math.random() * 200, de: 'Conta Principal', para: 'Farmacia', tipo: 'saida', categoria: 'Saude', dataComprovante: generateDate(baseDay + 12), createdAt: new Date().toISOString() },
      { id: String(id++), userId: '554899999999', valor: 200 + Math.random() * 100, de: 'Conta Principal', para: 'Material Escolar', tipo: 'saida', categoria: 'Filhos', dataComprovante: generateDate(baseDay + 14), createdAt: new Date().toISOString() },
      { id: String(id++), userId: '554899999999', valor: 300 + Math.random() * 200, de: 'Conta Principal', para: 'Cinema/Bar', tipo: 'saida', categoria: 'Lazer e Vida Social', dataComprovante: generateDate(baseDay + 18), createdAt: new Date().toISOString() },
      { id: String(id++), userId: '554899999999', valor: 500 + Math.random() * 200, de: 'Conta Principal', para: 'Curso Online', tipo: 'saida', categoria: 'Educacao', dataComprovante: generateDate(baseDay + 20), createdAt: new Date().toISOString() },
      { id: String(id++), userId: '554899999999', valor: 1000, de: 'Conta Principal', para: 'Poupanca', tipo: 'saida', categoria: 'Reserva', dataComprovante: generateDate(baseDay + 25), createdAt: new Date().toISOString() },
    );
  }

  // Dados de outro cliente
  records.push(
    { id: String(id++), userId: '554888888888', valor: 8000, de: 'Empresa XYZ', para: 'Conta', tipo: 'entrada', categoria: 'Site', dataComprovante: generateDate(3), createdAt: new Date().toISOString() },
    { id: String(id++), userId: '554888888888', valor: 4500, de: 'Consultoria', para: 'Conta', tipo: 'entrada', categoria: 'Automacao', dataComprovante: generateDate(10), createdAt: new Date().toISOString() },
    { id: String(id++), userId: '554888888888', valor: 2000, de: 'Conta', para: 'Aluguel', tipo: 'saida', categoria: 'Aluguel', dataComprovante: generateDate(5), createdAt: new Date().toISOString() },
    { id: String(id++), userId: '554888888888', valor: 1200, de: 'Conta', para: 'Mercado', tipo: 'saida', categoria: 'Alimentacao', dataComprovante: generateDate(8), createdAt: new Date().toISOString() },
    { id: String(id++), userId: '554888888888', valor: 800, de: 'Conta', para: 'Investimentos', tipo: 'saida', categoria: 'Reserva', dataComprovante: generateDate(12), createdAt: new Date().toISOString() },
  );

  return records;
};

export const mockFinanceRecords: FinanceRecord[] = generateMonthlyData();

// Dados de investimentos mock
export const mockInvestments = {
  total: 45680.50,
  rendimento: 2.8, // percentual
  patrimonio: 125000,
};

export const mockAIAlerts: AIAlert[] = [
  {
    id: '1',
    aviso: 'Gastos com Alimentacao aumentaram 23% em relacao ao mes anterior. Considere revisar seus habitos de compra.',
    userId: '554899999999',
    prioridade: 'alta',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    aviso: 'Voce atingiu 80% do limite mensal para FastFood. Ainda restam 5 dias para o fechamento.',
    userId: '554899999999',
    prioridade: 'media',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    aviso: 'Parabens! Voce economizou R$ 350 em Transporte este mes comparado a sua media.',
    userId: '554899999999',
    prioridade: 'baixa',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    aviso: 'Oportunidade: planos anuais de Ferramentas podem gerar economia de ate 20%.',
    userId: '554899999999',
    prioridade: 'baixa',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    aviso: 'Atencao: Reserva de emergencia esta abaixo do recomendado. Atual: 1.5 meses.',
    userId: '554899999999',
    prioridade: 'alta',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '6',
    aviso: 'Sua receita de Site cresceu 15% este mes. Continue assim!',
    userId: '554899999999',
    prioridade: 'baixa',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const getUniqueClients = () => {
  const clients = [...new Set(mockFinanceRecords.map(r => r.userId))];
  return clients.map(id => ({
    id,
    label: `+55 ${String(id).slice(2, 4)} ${String(id).slice(4, 9)}-${String(id).slice(9)}`
  }));
};
