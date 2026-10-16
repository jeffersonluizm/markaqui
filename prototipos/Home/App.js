import React, { useEffect, useMemo, useState } from 'react';

export default function HomeScreen() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ cliente: '', servico: '', data: '', hora: '' });
  const [editingId, setEditingId] = useState(null);
  const storageKey = useMemo(() => 'markaqui_agendamentos', []);
  const isValid = useMemo(() => {
    return (
      form.cliente.trim().length > 0 &&
      form.servico.trim().length > 0 &&
      form.data.trim().length > 0 &&
      form.hora.trim().length > 0
    );
  }, [form]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {}
  }, [storageKey]);
  const persist = (next) => {
    setItems(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  };
  
  const handleNavigation = (page) => {
    console.log(`Navegando para: ${page}`);
    // navegação 
    //  navigate(`/${page}`);
  };
  const resetForm = () => {
    setForm({ cliente: '', servico: '', data: '', hora: '' });
    setEditingId(null);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    if (editingId) {
      const next = items.map((it) => (it.id === editingId ? { ...it, ...form } : it));
      persist(next);
      resetForm();
      return;
    }
    const next = [
      ...items,
      {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        ...form,
      },
    ];
    persist(next);
    resetForm();
  };
  const handleEdit = (id) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    setForm({ cliente: it.cliente, servico: it.servico, data: it.data, hora: it.hora });
    setEditingId(id);
  };
  const handleDelete = (id) => {
    const next = items.filter((x) => x.id !== id);
    persist(next);
    if (editingId === id) resetForm();
  };

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <div style={styles.navbar}>
        <h1 
          style={styles.logoText}
          onClick={() => handleNavigation('home')}
        >
          Markaqui
        </h1>
        <div style={styles.menu}>
          <span 
            style={styles.menuItem}
            onClick={() => handleNavigation('home')}
          >
            Inicio
          </span>
          <span 
            style={styles.menuItem}
            onClick={() => handleNavigation('sobre')}
          >
            Sobre
          </span>
          <span 
            style={styles.menuItem}
            onClick={() => handleNavigation('contato')}
          >
            Contato
          </span>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div style={styles.main}>
        <h1 style={styles.title}>Simplifique o Agendamento de Serviços</h1>
        <p style={styles.subtitle}>
          Agende facilmente compromissos<br />
          com profissionais e serviços
        </p>

        {/* A ilustração original (mascote parecido com personagem de terceiros, por
            link externo) foi retirada na versão 2.0. */}

        {/* Botão */}
        <button 
          style={styles.button}
          onClick={() => handleNavigation('home')}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          <span style={styles.buttonText}>Comece agora</span>
        </button>
      </div>
      <div style={styles.crudContainer}>
        <h2 style={styles.sectionTitle}>Agendamentos</h2>
        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.formRow}>
            <input
              style={styles.input}
              placeholder="Cliente"
              value={form.cliente}
              onChange={(e) => setForm((f) => ({ ...f, cliente: e.target.value }))}
            />
            <input
              style={styles.input}
              placeholder="Serviço"
              value={form.servico}
              onChange={(e) => setForm((f) => ({ ...f, servico: e.target.value }))}
            />
          </div>
          <div style={styles.formRow}>
            <input
              style={styles.input}
              type="date"
              placeholder="Data"
              value={form.data}
              onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
            />
            <input
              style={styles.input}
              type="time"
              placeholder="Hora"
              value={form.hora}
              onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
            />
          </div>
          <div style={styles.actions}>
            <button style={{ ...styles.actionButton, ...styles.primary }} disabled={!isValid}>
              {editingId ? 'Salvar' : 'Adicionar'}
            </button>
            {editingId && (
              <button type="button" style={{ ...styles.actionButton, ...styles.secondary }} onClick={resetForm}>
                Cancelar
              </button>
            )}
          </div>
        </form>
        <div style={styles.list}>
          {items.length === 0 ? (
            <p style={styles.empty}>Nenhum agendamento cadastrado</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Serviço</th>
                  <th style={styles.th}>Data</th>
                  <th style={styles.th}>Hora</th>
                  <th style={styles.th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td style={styles.td}>{it.cliente}</td>
                    <td style={styles.td}>{it.servico}</td>
                    <td style={styles.td}>{it.data}</td>
                    <td style={styles.td}>{it.hora}</td>
                    <td style={styles.td}>
                      <button style={{ ...styles.smallButton, ...styles.primary }} onClick={() => handleEdit(it.id)}>Editar</button>
                      <button style={{ ...styles.smallButton, ...styles.danger }} onClick={() => handleDelete(it.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#d8ecf5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  logoText: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#000',
    margin: 0,
    cursor: 'pointer',
    transition: 'color 0.3s ease',
  },
  menu: {
    display: 'flex',
    gap: '30px',
  },
  menuItem: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#000',
    cursor: 'pointer',
    transition: 'color 0.3s ease',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
    minHeight: 'calc(100vh - 70px)',
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#1e3a56',
    marginBottom: '10px',
    marginTop: '60px',
    lineHeight: '1.2',
  },
  subtitle: {
    fontSize: '18px',
    color: '#555',
    marginBottom: '30px',
    lineHeight: '1.6',
  },
  illustrationContainer: {
    width: '100%',
    maxWidth: '500px',
    marginBottom: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 20px',
  },
  illustration: {
    width: '100%',
    height: 'auto',
    maxWidth: '450px',
    objectFit: 'contain',
  },
  button: {
    backgroundColor: '#1e3a56',
    color: '#fff',
    border: 'none',
    borderRadius: '30px',
    padding: '12px 50px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(30, 58, 86, 0.3)',
    marginBottom: '40px',
  },
  buttonText: {
    color: '#fff',
  },
  crudContainer: {
    maxWidth: '980px',
    margin: '0 auto',
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1e3a56',
    marginBottom: '12px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  input: {
    width: '100%',
    backgroundColor: '#f7fbfd',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #cbd5e1',
    outline: 'none',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-start',
  },
  actionButton: {
    borderRadius: '8px',
    border: 'none',
    padding: '10px 14px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  primary: {
    backgroundColor: '#1e3a56',
    color: '#fff',
  },
  secondary: {
    backgroundColor: '#e2e8f0',
    color: '#0f172a',
  },
  danger: {
    backgroundColor: '#dc2626',
    color: '#fff',
  },
  list: {
    marginTop: '8px',
  },
  empty: {
    color: '#475569',
    fontSize: '14px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '10px',
    fontSize: '13px',
    color: '#0f172a',
    borderBottom: '1px solid #e2e8f0',
  },
  td: {
    textAlign: 'left',
    padding: '10px',
    fontSize: '13px',
    color: '#0f172a',
    borderBottom: '1px solid #f1f5f9',
  },
  smallButton: {
    borderRadius: '6px',
    border: 'none',
    padding: '8px 10px',
    fontSize: '12px',
    cursor: 'pointer',
    marginRight: '8px',
  },
};