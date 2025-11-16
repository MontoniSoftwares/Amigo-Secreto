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
