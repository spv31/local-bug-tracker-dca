const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

let autenticado = false;
let username, password = undefined;

let reportesLista = [];
let usuariosLista = [{
  "username": "admin",
  "password": "admin",
}];

const compruebaDatosUsuario = (username, password) => {
  return usuariosLista.find(user => user.username == username && user.password == password)
}

const compruebaUsuarioExiste = (username) => {
  const user = usuariosLista.find(user => user.username == username);

  if (!user) {
    return [usuariosLista, false];
  }
  return [usuariosLista, true];
}

const cargarReportes = () => {
  return reportesLista;
}

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/views/login.html'));
})

app.post('/login', async (req, res) => {
  username = req.body.username;
  password = req.body.password;

  const usuarioCorrecto = await compruebaDatosUsuario(username, password);

  if (usuarioCorrecto) {
    autenticado = true;
    res.redirect('/reportes')
  } else {
    res.redirect('/login?e=' + encodeURIComponent('Datos incorrecos'));
  }
})

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/views/register.html'));
})

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  const [usuarios, usuarioExiste] = await compruebaUsuarioExiste(username);

  if (!usuarioExiste) {
    usuarios.push({ username, password });
    usuariosLista = usuarios;
    res.sendFile(path.join(__dirname, 'public/views/login.html'));
  } else {
    res.redirect('/register?e=' + encodeURIComponent('El usuario ya existe'));
  }
})

app.get('/reportes', (req, res) => {
  if (!autenticado) {
    res.redirect('/login')
  } else {
    // Renderizamos la vista con todos los reportes.
    const issues = reportesLista;
    res.render(path.join(__dirname, 'public/views/reportes.ejs'), { issues: issues, username: username });
  }
})

app.post('/reportes', (req, res) => {
  const admin = req.body.admin;
  const reporteId = req.body.issueId;
  const comentario = req.body.comentario;
  const reporteAbrir = req.body.issueAbrir;

  const issue = reportesLista.find(issue => issue.id == parseInt(reporteId));

  if (admin === "true" && reporteAbrir === "true") {
    issue.estado = "abierto"
  } else if (admin === "true") {
    issue.estado = "cerrado"
  }
  else {
    const nuevoComentrio = {
      "autor": username,
      "fechaComentario": new Date().toISOString().split('T')[0],
      "comentario": comentario
    }
    issue.mensajes.push(nuevoComentrio);
  }

  res.redirect('/reportes');
})

app.get('/crear-reporte', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/views/crear-reporte.html'));
})

app.post('/crear-reporte', (req, res) => {
  const { descripcionError, fechaDeteccion } = req.body;

  let ultimoId, ultimoIssue

  if (reportesLista.length > 0) {
    ultimoIssue = reportesLista[reportesLista.length - 1];
    ultimoId = ultimoIssue.id;
  } else {
    ultimoId = 0;
  }

  const nuevoReporte = {
    "id": ultimoId + 1,
    "autor": username,
    "descripcionError": descripcionError,
    "fechaDeteccion": fechaDeteccion,
    "fechaApertura": new Date().toISOString().split('T')[0],
    "estado": 'abierto',
    "mensajes": []
  };
  reportesLista.push(nuevoReporte)

  res.redirect('/reportes');
})

app.listen(port);