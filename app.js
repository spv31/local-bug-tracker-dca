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
let usuariosLista = []

const compruebaDatosUsuario = async (username, password) => {
  const datos = await cargarUsuarios();
  return datos.find(user => user.username == username && user.password == password)
}

const compruebaUsuarioExiste = async (username) => {
  const datos = await cargarUsuarios();
  const user = datos.find(user => user.username == username);

  if (!user) {
    return [datos, false];
  }
  return [datos, true];
}

const cargarReportes = () => {
  // const data = fs.readFileSync(path.join(__dirname, 'public/data/reportes.json'));
  // return JSON.parse(reportesLista);
  return reportesLista;
}

const cargarUsuarios = async () => {
  // const data = fs.readFileSync(path.join(__dirname, 'public/data/usuarios.json'));
  // return JSON.parse(usuariosLista);
  return usuariosLista;
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
    // fs.writeFileSync(path.join(__dirname, 'public/data/usuarios.json'), JSON.stringify(usuarios))
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
    // const issues = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/data/reportes.json')));
    const issues = reportesLista;
    res.render(path.join(__dirname, 'public/views/reportes.ejs'), { issues: issues, username: username });
  }
})

app.post('/reportes', async (req, res) => {
  const admin = req.body.admin;
  const reporteId = req.body.issueId;
  const comentario = req.body.comentario;
  const reporteAbrir = req.body.issueAbrir;

  const issues = await cargarReportes();
  const issue = issues.find(issue => issue.id == parseInt(reporteId));

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
  // fs.writeFileSync(path.join(__dirname, 'public/data/reportes.json'), JSON.stringify(issues))
  reportesLista = issues;
  res.redirect('/reportes');
})

app.get('/crear-reporte', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/views/crear-reporte.html'));
})

app.post('/crear-reporte', async (req, res) => {
  const { descripcionError, fechaDeteccion } = req.body;

  const issues = await cargarReportes();

  let ultimoId, ultimoIssue

  if (issues.length > 0) {
    ultimoIssue = issues[issues.length - 1];
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
  issues.push(nuevoReporte)
  reportesLista = issues;
  // fs.writeFileSync(path.join(__dirname, 'public/data/reportes.json'), JSON.stringify(issues))

  res.redirect('/reportes');
})

app.listen(port, () => {
  console.log('Escuchando en el puerto ' + port);
})