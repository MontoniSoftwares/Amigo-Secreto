<template>
  <div id="app">
    <header>
      <h1>Amigo Secreto Raspadinha</h1>
      <nav>
        <button :class="{ active: modo === 'admin' }" @click="modo = 'admin'">
          Admin
        </button>
        <button
          :class="{ active: modo === 'participant' }"
          @click="modo = 'participant'"
        >
          Participante
        </button>
      </nav>
    </header>
    <main>
      <Admin v-if="modo === 'admin'" />
      <Participant v-else />
    </main>
    <footer class="footer-ms">
      <div class="footer-ms-row">
        <img
          :src="logoMs"
          alt="Logo Montoni Tech Soluções"
          class="footer-logo"
        />
        <span class="footer-ms-title">Montoni Tech Soluções</span>
        <span class="footer-ms-cnpj">CNPJ: 62.553.238/0001-00</span>
        <span class="footer-ms-copyright">
          &copy; {{ new Date().getFullYear() }} Montoni Tech Soluções. Todos os
          direitos reservados.
        </span>
      </div>
    </footer>
  </div>
</template>

<script>
import logoMs from "./assets/logo-ms.png";
import Admin from "./components/Admin.vue";
import Participant from "./components/Participant.vue";

export default {
  components: { Admin, Participant },
  data() {
    return {
      modo: "participant",
      logoMs,
    };
  },
};
</script>

<style>
body {
  margin: 0;
  padding: 0;
  background: #262626;
}

#app {
  width: 100%;
  min-height: 100vh;
  font-family: "Montserrat", Arial, sans-serif;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  box-sizing: border-box;
}

header {
  text-align: center;
  margin-bottom: 20px;
}

header h1 {
  font-size: 1.5rem;
}

nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 12px;
}

nav button {
  background: transparent;
  border: 3px solid #ff4b5c;
  color: #ff4b5c;
  padding: 10px 15px;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0;
  min-width: 80px;
  box-sizing: border-box;
}

nav button.active {
  background: #ff4b5c;
  color: white;
}

nav button:hover {
  background: #ff4b5c;
  color: #fff;
}

main {
  width: 100%;
  max-width: 300px;
  margin: 0 auto 18px auto;
  font-size: 0.9rem;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  flex: 1;
  box-sizing: border-box;
}

.footer-ms {
  color: #fff;
  padding: 6px 0 4px 0;
  width: 100%;
  margin: 0;
  box-sizing: border-box;
  border-top: 1.5px solid #59b7fa;
  background: none;
}

.footer-ms-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 0 6px;
  flex-wrap: wrap;
}

.footer-logo {
  max-width: 200px; /* largura máxima desejada */
  max-height: 200px; /* altura máxima para evitar excessos */
  width: 200px; /* deixa a largura proporcional */
  height: 200px; /* deixa a altura proporcional */
  margin: 0 auto;
  display: block;
  border-radius: 7px;
  padding: 2px 7px;
  box-shadow: 0 2px 8px #2223;
}

.footer-ms-title {
  font-weight: bold;
  font-size: 1.11em;
}

.footer-ms-cnpj {
  color: #59b7fa;
  margin-left: 8px;
}

.footer-ms-copyright {
  color: #cccccc;
  font-size: 1em;
  margin-left: 10px;
}

@media (max-width: 600px) {
  html,
  body,
  #app {
    width: 100vw !important;
    min-width: 100vw !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
  }

  nav {
    gap: 4px !important;
    width: 99vw !important;
    margin: 0 auto 12px auto !important;
  }

  nav button {
    font-size: 1rem !important;
    padding: 8px 2px !important;
    min-width: 0 !important;
  }

  .footer-ms-row {
    flex-direction: column !important;
    align-items: center !important;
    gap: 8px !important;
    padding: 2vw !important;
    text-align: center !important;
    width: 99vw !important;
    margin: 0 auto !important;
  }

  .footer-logo {
    display: block !important;
    max-width: 70vw !important;
    width: 80px !important;
    height: auto !important;
    margin: 0 auto 4px auto !important;
  }
}
</style>
