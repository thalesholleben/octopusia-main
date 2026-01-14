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
    
    // Entradas do mês
    records.push(
      { id: id++, client_id: 554899999999, valor: 5500 + Math.random() * 2000, de: 'Cliente ABC', para: 'Conta Principal', tipo: 'entrada', categoria: 'Site', data_comprovante: generateDate(baseDay + 2), created_at: new Date().toISOString() },
      { id: id++, client_id: 554899999999, valor: 3200 + Math.random() * 1000, de: 'Projeto X', para: 'Conta Principal', tipo: 'entrada', categoria: 'Automação', data_comprovante: generateDate(baseDay + 8), created_at: new Date().toISOString() },
      { id: id++, client_id: 554899999999, valor: 1800 + Math.random() * 800, de: 'Logo Design', para: 'Conta Principal', tipo: 'entrada', categoria: 'Design', data_comprovante: generateDate(baseDay + 15), created_at: new Date().toISOString() },
      { id: id++, client_id: 554899999999, valor: 2500 + Math.random() * 1500, de: 'Cliente DEF', para: 'Conta Principal', tipo: 'entrada', categoria: 'Site', data_comprovante: generateDate(baseDay + 22), created_at: new Date().toISOString() },
    );
    
    // Saídas do mês
    records.push(
      { id: id++, client_id: 554899999999, valor: 1500, de: 'Conta Principal', para: 'Proprietário', tipo: 'saida', categoria: 'Aluguel', data_comprovante: generateDate(baseDay + 1), created_at: new Date().toISOString() },
      { id: id++, client_id: 554899999999, valor: 450 + Math.random() * 100, de: 'Conta Principal', para: 'CPFL', tipo: 'saida', categoria: 'Contas Fixas', data_comprovante: generateDate(baseDay + 3), created_at: new Date().toISOString() },
      { id: id++, client_id: 554899999999, valor: 800 + Math.random() * 300, de: 'Conta Principal', para: 'Supermercado', tipo: 'saida', categoria: 'Alimentação', data_comprovante: generateDate(baseDay + 5), created_at: new Date().toISOString() },
      { id: id++, client_id: 554899999999, valor: 120 + Math.random() * 80, de: 'Conta Principal', para: 'iFood', tipo: 'saida', categoria: 'FastFood', data_comprovante: generateDate(baseDay + 7), created_at: new Date().toISOString() },
      { id: id++, client_id: 554899999999, valor: 350 + Math.random() * 150, de: 'Conta Principal', para: 'Uber/99', tipo: 'saida', categoria: 'Transporte', data_comprovante: generateDate(baseDay + 10), created_at: new Date().toISOString() },
      { id: id++, client_id: 554899999999, valor: 280 + Math.random() * 200, de: 'Conta Principal', para: 'Farmácia', tipo: 'saida', categoria: 'Saúde', data_comprovante: generateDate(baseDay + 12), created_at: new Date().toISOString() },
      { id: id++, client_id: 554899999999, valor: 200 + Math.random() * 100, de: 'Conta Principal', para: 'Material Escolar', tipo: 'saida', categoria: 'Filhos', data_comprovante: generateDate(baseDay + 14), created_at: new Date().toISOString() },
      { id: id++, client_id: 554899999999, valor: 300 + Math.random() * 200, de: 'Conta Principal', para: 'Cinema/Bar', tipo: 'saida', categoria: 'Lazer e Vida Social', data_comprovante: generateDate(baseDay + 18), created_at: new Date().toISOString() },
      { id: id++, client_id: 554899999999, valor: 500 + Math.random() * 200, de: 'Conta Principal', para: 'Curso Online', tipo: 'saida', categoria: 'Educação', data_comprovante: generateDate(baseDay + 20), created_at: new Date().toISOString() },
      { id: id++, client_id: 554899999999, valor: 1000, de: 'Conta Principal', para: 'Poupança', tipo: 'saida', categoria: 'Reserva', data_comprovante: generateDate(baseDay + 25), created_at: new Date().toISOString() },
    );
  }
  
  // Dados de outro cliente
  records.push(
    { id: id++, client_id: 554888888888, valor: 8000, de: 'Empresa XYZ', para: 'Conta', tipo: 'entrada', categoria: 'Site', data_comprovante: generateDate(3), created_at: new Date().toISOString() },
    { id: id++, client_id: 554888888888, valor: 4500, de: 'Consultoria', para: 'Conta', tipo: 'entrada', categoria: 'Automação', data_comprovante: generateDate(10), created_at: new Date().toISOString() },
    { id: id++, client_id: 554888888888, valor: 2000, de: 'Conta', para: 'Aluguel', tipo: 'saida', categoria: 'Aluguel', data_comprovante: generateDate(5), created_at: new Date().toISOString() },
    { id: id++, client_id: 554888888888, valor: 1200, de: 'Conta', para: 'Mercado', tipo: 'saida', categoria: 'Alimentação', data_comprovante: generateDate(8), created_at: new Date().toISOString() },
    { id: id++, client_id: 554888888888, valor: 800, de: 'Conta', para: 'Investimentos', tipo: 'saida', categoria: 'Reserva', data_comprovante: generateDate(12), created_at: new Date().toISOString() },
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
    id: 1,
    aviso: 'Gastos com Alimentação aumentaram 23% em relação ao mês anterior. Considere revisar seus hábitos de compra.',
    client_id: 554899999999,
    prioridade: 'alta',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    aviso: 'Você atingiu 80% do limite mensal para FastFood. Ainda restam 5 dias para o fechamento.',
    client_id: 554899999999,
    prioridade: 'media',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    aviso: 'Parabéns! Você economizou R$ 350 em Transporte este mês comparado à sua média.',
    client_id: 554899999999,
    prioridade: 'baixa',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    aviso: 'Oportunidade: planos anuais de Ferramentas podem gerar economia de até 20%.',
    client_id: 554899999999,
    prioridade: 'baixa',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 5,
    aviso: 'Atenção: Reserva de emergência está abaixo do recomendado. Atual: 1.5 meses.',
    client_id: 554899999999,
    prioridade: 'alta',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 6,
    aviso: 'Sua receita de Site cresceu 15% este mês. Continue assim!',
    client_id: 554899999999,
    prioridade: 'baixa',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const getUniqueClients = () => {
  const clients = [...new Set(mockFinanceRecords.map(r => r.client_id))];
  return clients.map(id => ({
    id,
    label: `+55 ${String(id).slice(2, 4)} ${String(id).slice(4, 9)}-${String(id).slice(9)}`
  }));
};
