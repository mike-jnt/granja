/* Debug overlay: muestra errores JS directamente en pantalla (útil en GitHub Pages) */
(function(){
  const makeBox = () => {
    let box = document.getElementById('__err_overlay__');
    if (box) return box;
    box = document.createElement('div');
    box.id='__err_overlay__';
    box.style.position='fixed';
    box.style.left='12px';
    box.style.right='12px';
    box.style.bottom='12px';
    box.style.maxHeight='40vh';
    box.style.overflow='auto';
    box.style.zIndex='999999';
    box.style.padding='12px 14px';
    box.style.borderRadius='12px';
    box.style.background='rgba(0,0,0,.85)';
    box.style.color='#fff';
    box.style.fontFamily='ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
    box.style.fontSize='12px';
    box.style.lineHeight='1.4';
    box.style.boxShadow='0 10px 30px rgba(0,0,0,.35)';
    box.style.display='none';
    const btn = document.createElement('button');
    btn.textContent='×';
    btn.title='Cerrar';
    btn.style.cssText='position:absolute;top:6px;right:8px;border:0;background:transparent;color:#fff;font-size:16px;cursor:pointer;';
    btn.onclick=()=>{ box.style.display='none'; box.innerHTML=''; box.appendChild(btn); };
    box.appendChild(btn);
    document.body.appendChild(box);
    return box;
  };

  const show = (title, msg) => {
    try{
      const box = makeBox();
      box.style.display='block';
      const wrap = document.createElement('div');
      wrap.style.marginTop='16px';
      wrap.innerHTML = '<div style="font-weight:800;margin-bottom:6px">'+title+'</div>'
        + '<div style="white-space:pre-wrap">'+String(msg)+'</div>';
      box.appendChild(wrap);
    }catch(e){
      // fallback silencioso
      console.error(title, msg);
    }
  };

  window.addEventListener('error', (e)=>{
    const where = (e.filename? (e.filename.split('/').pop()+':'+e.lineno+':'+e.colno) : '');
    show('Error de JavaScript', (e.message||'') + (where? '\n'+where:'' ));
  });

  window.addEventListener('unhandledrejection', (e)=>{
    show('Promesa rechazada', (e.reason && (e.reason.stack||e.reason.message)) || e.reason || 'Unhandled rejection');
  });

  // Señal de carga (para saber que el JS sí corrió)
  window.__APP_BOOT_OK__ = true;
})();

(() => {
        "use strict";
        const $ = (s, el = document) => el.querySelector(s);
        const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
        const KEY = "granja_porcina_v1_compact";

        // -------- Safe storage (fallback si localStorage no está disponible) --------
        const storage = (() => {
          const test = (s) => {
            try {
              const k = "__gp_test__";
              s.setItem(k, "1");
              s.removeItem(k);
              return true;
            } catch {
              return false;
            }
          };
          if (typeof localStorage !== "undefined" && test(localStorage))
            return localStorage;
          if (typeof sessionStorage !== "undefined" && test(sessionStorage))
            return sessionStorage;
          const mem = Object.create(null);
          return {
            getItem: (k) => (k in mem ? mem[k] : null),
            setItem: (k, v) => {
              mem[k] = String(v);
            },
            removeItem: (k) => {
              delete mem[k];
            },
          };
        })();

        // -------- Auth (Inicio de sesión) --------
        const AUTH_KEY = "gp_auth_v1";
        const AUTH_USERS = [
          // Cambia estos datos si quieres otros credenciales por defecto
          { user: "admin", pass: "admin" },
        ];

        const authGet = () => {
          try {
            return JSON.parse(storage.getItem(AUTH_KEY) || "null");
          } catch {
            return null;
          }
        };
        const isAuthed = () => !!(authGet() && authGet().ok);
        const authSet = (ok, user = "") => {
          storage.setItem(
            AUTH_KEY,
            JSON.stringify({
              ok: !!ok,
              user: String(user || ""),
              ts: Date.now(),
            }),
          );
        };

        const lockUI = (locked) => {
          const scr = $("#loginScreen");
          document.body.classList.toggle("auth-locked", !!locked);
          if (scr) scr.style.display = locked ? "flex" : "none";
        };

        const doLogout = () => {
          try {
            $("#dlg")?.close();
          } catch (e) {}
          try {
            $("#dlg2")?.close();
          } catch (e) {}
          authSet(false, "");
          // limpiar campos
          const u = $("#loginUser");
          const p = $("#loginPass");
          if (u) u.value = "";
          if (p) p.value = "";
          lockUI(true);
        };

        function openLogout() {
          openModal({
            title: "Cerrar sesión",
            sub: "¿Deseas cerrar la sesión actual?",
            body: `<div class="muted">Al cerrar sesión se ocultará el sistema hasta que vuelvas a iniciar.</div>`,
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn danger" id="mOk">Cerrar sesión</button>`,
            onMount: () => {
              const ok = $("#mOk", dlgFt);
              if (ok)
                ok.onclick = () => {
                  doLogout();
                  try {
                    dlg.close();
                  } catch (e) {}
                };
            },
          });
        }

        const initials2 = (name) => {
          name = String(name || "").trim();
          if (!name) return "GP";
          const parts = name.split(/\s+/).filter(Boolean);
          const a = (parts[0] || "G")[0] || "G";
          const b = (parts[1] || parts[0] || "P")[0] || "P";
          return (a + b).toUpperCase().slice(0, 2);
        };

        function setupAuth() {
          const scr = $("#loginScreen");
          if (!scr) return;

          const form = $("#loginForm");
          const u = $("#loginUser");
          const p = $("#loginPass");
          const msg = $("#loginMsg");
          const toggle = $("#togglePass");

          const applyBrand = () => {
            const n =
              typeof state !== "undefined" && state?.settings?.farmName
                ? state.settings.farmName
                : $("#farmName")?.textContent || "Granja Porcícola Campo Bello";
            const el1 = $("#loginAppName");
            if (el1) el1.textContent = n;
            const el2 = $("#loginAppNameLeft");
            if (el2) el2.textContent = n;
            // Nota: el logo del login es una imagen, no lo sobreescribimos con iniciales.
          };

          const showMsg = (text) => {
            if (!msg) return;
            msg.style.display = text ? "block" : "none";
            msg.textContent = text || "";
          };

          if (toggle && p) {
            toggle.onclick = () => {
              p.type = p.type === "password" ? "text" : "password";
              toggle.textContent = p.type === "password" ? "👁️" : "🙈";
            };
          }

          const applyLock = () => {
            lockUI(!isAuthed());
            applyBrand();
          };

          applyLock();

          if (form) {
            form.onsubmit = (e) => {
              e.preventDefault();
              const user = (u?.value || "").trim();
              const pass = (p?.value || "").trim();
              if (!user || !pass) {
                showMsg("Debes ingresar usuario y contraseña.");
                return;
              }
              const ok = AUTH_USERS.some(
                (x) =>
                  String(x.user).toLowerCase() === user.toLowerCase() &&
                  String(x.pass) === pass,
              );
              if (!ok) {
                showMsg("Usuario o contraseña incorrectos.");
                return;
              }
              authSet(true, user);
              showMsg("");
              lockUI(false);
              toast("ok", "Sesión iniciada", user);
              render();
            };
          }

          // Exponer para refrescar el nombre si cambia en Ajustes
          window.__refreshLoginBrand = applyBrand;
        }
        const uid = (p = "id") =>
          p +
          "_" +
          Math.random().toString(16).slice(2) +
          "_" +
          Date.now().toString(16);
        const today = () => new Date().toISOString().slice(0, 10);
        const num = (v) => {
          let s = String(v ?? "").trim();
          if (!s) return 0;
          s = s.replace(/[^0-9.,-]/g, "");
          s = s.replace(/(?!^)-/g, ""); // solo un "-"
          // Patrones de miles: 1.234 o 1.234.567 / 1,234,567
          if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
            s = s.replace(/\./g, "");
          } else if (/^-?\d{1,3}(,\d{3})+$/.test(s)) {
            s = s.replace(/,/g, "");
          } else if (s.includes(".") && s.includes(",")) {
            // "." miles y "," decimal
            s = s.replace(/\./g, "").replace(",", ".");
          } else {
            const dots = (s.match(/\./g) || []).length;
            const commas = (s.match(/,/g) || []).length;
            if (dots > 1 && commas === 0) s = s.replace(/\./g, "");
            else if (commas > 1 && dots === 0) s = s.replace(/,/g, "");
            else if (commas === 1 && dots === 0) s = s.replace(",", ".");
          }
          const n = Number(s);
          return Number.isFinite(n) ? n : 0;
        };
        const addDays = (iso, d) => {
          const x = new Date(iso + "T00:00:00");
          x.setDate(x.getDate() + d);
          return x.toISOString().slice(0, 10);
        };
        const daysBetween = (a, b) =>
          Math.round(
            (new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) /
              (1000 * 60 * 60 * 24),
          );
        const esc = (s) =>
          String(s ?? "").replace(
            /[<>&]/g,
            (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[ch],
          );
        const fmtCOP = (n) => {
          n = num(n);
          try {
            return n.toLocaleString("es-CO", {
              style: "currency",
              currency: "COP",
              maximumFractionDigits: 0,
            });
          } catch {
            return "COP " + Math.round(n).toString();
          }
        };

        const fmtNum = (n, dec = 0) => {
          n = num(n);
          if (!Number.isFinite(n)) n = 0;
          const sign = n < 0 ? "-" : "";
          n = Math.abs(n);
          const p = Math.pow(10, Math.max(0, dec | 0));
          const r = Math.round(n * p) / p;
          const i = Math.trunc(r);
          const frac = Math.round((r - i) * p);
          const intStr = i.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
          if (dec <= 0) return sign + intStr;
          if (frac <= 0) return sign + intStr;
          const fracStr = frac.toString().padStart(dec, "0");
          return sign + intStr + "," + fracStr;
        };

        // Helper para KPIs reutilizables
        const kpi = (label, value, kindOrSub = "", sub = "") => {
          const kinds = ["ok", "warn", "bad", "info"];
          const kind = kinds.includes(kindOrSub) ? kindOrSub : "";
          const subtitle = kind ? sub || "" : kindOrSub || sub || "";
          return `<div class="kpi${kind ? " " + kind : ""}">
      <small>${esc(label)}</small>
      <b>${value}</b>
      <div class="muted mono">${esc(subtitle || "")}</div>
    </div>`;
        };

        // ------- Máscara de números (dinero y cantidades) con puntuación mientras escribes -------
        const numberFormatStr = (v, decimals = 0) => {
          let s = String(v ?? "");
          if (!s) return "";
          s = s.replace(/[^\d.,]/g, "");
          if (!s) return "";
          let dec = "";
          if (decimals > 0) {
            const lastComma = s.lastIndexOf(",");
            const lastDot = s.lastIndexOf(".");
            const lastSep = Math.max(lastComma, lastDot);
            if (lastSep > -1) {
              const after = s.slice(lastSep + 1).replace(/[^\d]/g, "");
              const before = s.slice(0, lastSep);
              // Heurística: si después hay 1-2 dígitos => decimal; si hay 3 => miles
              if (
                after.length > 0 &&
                after.length <= decimals &&
                after.length !== 3
              ) {
                dec = after.slice(0, decimals);
                s = before;
              } else if (after.length > 0 && after.length < 3) {
                dec = after.slice(0, decimals);
                s = before;
              } // else: tratar como miles
            }
          }
          const intDigits = s.replace(/[^\d]/g, "");
          const intFormatted = intDigits
            ? intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
            : "";
          if (dec) return (intFormatted || "0") + "," + dec;
          return intFormatted;
        };

        // Compatibilidad: dinero = entero COP
        const moneyFormatStr = (v) => numberFormatStr(v, 0);

        const moneyKeys = new Set([
          "unitprice",
          "unitcost",
          "totalcost",
          "paidamount",
          "amount",
          "total",
          "invtotal",
          "payamount",
          "cxpamount",
          "invunit",
          "invpaidnow",
          "price",
          "cost",
          "valor",
          "monto",
        ]);
        const qtyHints = [
          "qty",
          "cantidad",
          "count",
          "stock",
          "units",
          "unidades",
          "born",
          "deaths",
          "alive",
          "current",
          "peso",
          "weight",
          "litters",
        ];

        const getMaskInfo = (el) => {
          if (!el || el.tagName !== "INPUT") return null;
          const t = (el.getAttribute("type") || "").toLowerCase();
          if (
            t === "range" ||
            t === "date" ||
            t === "checkbox" ||
            t === "radio" ||
            t === "color"
          )
            return null;

          const name = (el.name || "").toLowerCase();
          const id = (el.id || "").toLowerCase();

          // Prioridad: dinero
          const isMoney =
            moneyKeys.has(name) ||
            moneyKeys.has(id) ||
            el.dataset.money === "1";
          // Cantidades: inputs numéricos o que contengan pistas
          const isQty =
            !isMoney &&
            (el.dataset.qty === "1" ||
              t === "number" ||
              qtyHints.some((h) => name.includes(h) || id.includes(h)));

          if (!isMoney && !isQty) return null;

          // Decimales para cantidades solo si el step lo sugiere (ej: 0.1, 0.01)
          let decimals = 0;
          if (isQty) {
            const step = (el.getAttribute("step") || "").toString();
            if (step.includes(".") && step !== "1") {
              decimals = Math.min(4, (step.split(".")[1] || "").length);
            } else if (step.includes(",") && step !== "1") {
              decimals = Math.min(4, (step.split(",")[1] || "").length);
            }
          }
          return { kind: isMoney ? "money" : "qty", decimals };
        };

        const setMoney = (el, n) => {
          if (el) el.value = moneyFormatStr(Math.max(0, Math.round(num(n))));
        };
        const setQty = (el, n) => {
          if (el) el.value = numberFormatStr(num(n), 0);
        };

        function bindMoneyInputs(root = document) {
          const scope = root?.querySelectorAll ? root : document;
          scope.querySelectorAll("input").forEach((el) => {
            const info = getMaskInfo(el);
            if (!info) return;

            // Evita duplicar listeners
            if (el.dataset.moneyBound === "1") {
              el.value =
                info.kind === "money"
                  ? moneyFormatStr(el.value)
                  : numberFormatStr(el.value, info.decimals);
              return;
            }
            el.dataset.moneyBound = "1";

            // Cambia a texto para permitir puntos
            try {
              el.type = "text";
            } catch {}
            el.inputMode = "numeric";
            el.autocomplete = "off";
            el.spellcheck = false;

            // Formatea inicial
            el.value =
              info.kind === "money"
                ? moneyFormatStr(el.value)
                : numberFormatStr(el.value, info.decimals);

            el.addEventListener("input", () => {
              el.value =
                info.kind === "money"
                  ? moneyFormatStr(el.value)
                  : numberFormatStr(el.value, info.decimals);
              // caret al final (simple y estable)
              try {
                el.setSelectionRange(el.value.length, el.value.length);
              } catch {}
            });

            el.addEventListener("blur", () => {
              el.value =
                info.kind === "money"
                  ? moneyFormatStr(el.value)
                  : numberFormatStr(el.value, info.decimals);
            });
          });
        }

        // ------- Costeo / inversión por cerda y por camada -------
        const moveCost = (m) => {
          const it = get.inv(m.itemId);
          const uc = num(m.unitCost) || num(it?.unitCost) || 0;
          const q = Math.abs(num(m.qty));
          return q * uc;
        };
        const invested = {
          sow: (sowId) =>
            (state.stockMovements || [])
              .filter(
                (m) =>
                  m.type === "salida" &&
                  m.linkedType === "sow" &&
                  m.linkedId === sowId,
              )
              .reduce((s, m) => s + moveCost(m), 0),
          batch: (batchId) =>
            (state.stockMovements || [])
              .filter(
                (m) =>
                  m.type === "salida" &&
                  m.linkedType === "batch" &&
                  m.linkedId === batchId,
              )
              .reduce((s, m) => s + moveCost(m), 0),
          list: (type, id, limit = 8) =>
            (state.stockMovements || [])
              .filter(
                (m) =>
                  m.type === "salida" &&
                  m.linkedType === type &&
                  m.linkedId === id,
              )
              .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
              .slice(0, limit),
        };

        // ------- Utilidad / ganancias (lechones) -------
        function profitStatsForBatch(batchId) {
          const sales = (state.sales || []).filter(
            (s) => s.batchId === batchId,
          );
          const qtySold = sales.reduce(
            (a, s) => a + Math.max(0, num(s.qty)),
            0,
          );
          const sold = sales.reduce((a, s) => a + Math.max(0, num(s.total)), 0);
          const collected = sales.reduce(
            (a, s) => a + Math.max(0, num(s.paidAmount)),
            0,
          );
          const pending = Math.max(0, sold - collected);
          const cost = Math.max(0, invested.batch(batchId));
          const profitEst = sold - cost;
          return { sales, qtySold, sold, collected, pending, cost, profitEst };
        }

        function profitStatsForSow(sowId) {
          const batches = (state.batches || []).filter(
            (b) => b.sowId === sowId,
          );
          const per = batches
            .map((b) => {
              const st = profitStatsForBatch(b.id);
              return {
                batch: b,
                qtySold: st.qtySold,
                sold: st.sold,
                collected: st.collected,
                pending: st.pending,
                cost: st.cost,
                profitEst: st.sold - st.cost,
              };
            })
            .sort((a, b) =>
              (b.batch.birthDate || "").localeCompare(a.batch.birthDate || ""),
            );

          const qtySold = per.reduce((a, x) => a + x.qtySold, 0);
          const sold = per.reduce((a, x) => a + x.sold, 0);
          const collected = per.reduce((a, x) => a + x.collected, 0);
          const pending = Math.max(0, sold - collected);

          const costS = Math.max(0, invested.sow(sowId));
          const costB = per.reduce((a, x) => a + x.cost, 0);
          const profitEst = sold - (costS + costB);

          return {
            per,
            qtySold,
            sold,
            collected,
            pending,
            costS,
            costB,
            profitEst,
          };
        }

        function supplyHistoryHTML(type, id, limit = 60) {
          const title =
            type === "sow"
              ? "Historial de suministros (cerda)"
              : "Historial de suministros (camada)";
          const total = type === "sow" ? invested.sow(id) : invested.batch(id);
          const all = (state.stockMovements || [])
            .filter(
              (m) =>
                m.type === "salida" &&
                m.linkedType === type &&
                m.linkedId === id,
            )
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
          const rows = all
            .slice(0, limit)
            .map((m) => {
              const it = get.inv(m.itemId);
              const uc = num(m.unitCost) || num(it?.unitCost) || 0;
              const q = Math.abs(num(m.qty));
              const cost = q * uc;
              return `<tr>
        <td class="mono">${esc(m.date || "—")}</td>
        <td><b>${esc(it?.name || "Insumo")}</b><div class="muted">${esc(it?.category || "")}</div></td>
        <td class="mono">${esc(q)} ${esc(it?.unit || "")}</td>
        <td class="mono">${esc(fmtCOP(cost))}</td>
      </tr>`;
            })
            .join("");
          const note =
            all.length > limit
              ? `<div class="muted" style="margin-top:8px">Mostrando ${limit} de ${all.length} registros.</div>`
              : "";
          return `
      <div class="card">
        <div class="hd">
          <div><h2>${title}</h2><p>Fecha • Cantidad • Costo</p></div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <span class="tag info">Total: <span class="mono">${fmtCOP(total)}</span></span>
            <button class="btn primary" type="button" data-supply="${type}" data-supplyid="${id}">➖ Registrar suministro</button>
          </div>
        </div>
        <div class="bd">
          <div class="wrap"><table>
            <thead><tr><th>Fecha</th><th>Insumo</th><th>Cantidad</th><th>Costo</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="4" class="muted">Aún no hay suministros registrados.</td></tr>`}</tbody>
          </table></div>
          ${note}
        </div>
      </div>
    `;
        }

        // ------- Ganancias / utilidad por camada y por cerda -------
        function salesStatsForBatch(batchId) {
          const sales = (state.sales || []).filter(
            (s) => s.batchId === batchId,
          );
          const sold = sales.reduce((sum, s) => sum + num(s.total), 0);
          const collected = sales.reduce(
            (sum, s) => sum + num(s.paidAmount),
            0,
          );
          const pending = Math.max(0, sold - collected);
          const qtySold = sales.reduce((sum, s) => sum + num(s.qty), 0);
          return { sales, sold, collected, pending, qtySold };
        }

        function profitHistoryHTML(type, id) {
          if (type === "batch") {
            const b = get.batch(id);
            if (!b) return "";
            const st = profitStatsForBatch(id);
            const profitTag =
              st.profitEst >= 0
                ? `<span class="tag ok">Utilidad: <span class="mono">${fmtCOP(st.profitEst)}</span></span>`
                : `<span class="tag bad">Pérdida: <span class="mono">${fmtCOP(st.profitEst)}</span></span>`;
            const rows = st.sales
              .slice()
              .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
              .map((s) => {
                const c = get.client(s.clientId);
                const p = Math.max(0, num(s.total) - num(s.paidAmount));
                return `<tr>
          <td class="mono">${esc(s.date || "—")}</td>
          <td><b>${esc(c?.name || "Cliente")}</b><div class="muted">Venta ${esc(s.id.slice(-6))}</div></td>
          <td class="mono">${esc(s.qty || 0)}</td>
          <td class="mono">${esc(fmtCOP(num(s.total)))}</td>
          <td class="mono">${esc(fmtCOP(num(s.paidAmount)))}</td>
          <td class="mono">${esc(fmtCOP(p))}</td>
        </tr>`;
              })
              .join("");

            return `
        <div class="card">
          <div class="hd">
            <div><h2>Ganancias de esta camada</h2><p>Ventas • Cobros • Utilidad</p></div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              ${profitTag}
              <span class="tag info">Inversión: <span class="mono">${fmtCOP(st.cost)}</span></span>
            </div>
          </div>
          <div class="bd">
            <div class="kpis">
              <div class="kpi"><small>Lechones vendidos</small><b class="mono">${esc(st.qtySold || 0)}</b></div>
              <div class="kpi"><small>Total vendido</small><b class="mono">${fmtCOP(st.sold)}</b></div>
              <div class="kpi"><small>Cobrado</small><b class="mono">${fmtCOP(st.collected)}</b></div>
              <div class="kpi"><small>Pendiente</small><b class="mono">${fmtCOP(st.pending)}</b></div>
            </div>
            <div class="wrap"><table>
              <thead><tr><th>Fecha</th><th>Cliente</th><th>Cant.</th><th>Total</th><th>Cobrado</th><th>Pendiente</th></tr></thead>
              <tbody>${rows || `<tr><td colspan="6" class="muted">Aún no hay ventas registradas para esta camada.</td></tr>`}</tbody>
            </table></div>
            <div class="emptyBig">
              <b>Utilidad estimada</b>
              <div class="muted">Total vendido − inversión de insumos (salidas relacionadas a la camada).</div>
              <div style="margin-top:6px"><b class="mono">${fmtCOP(st.profitEst)}</b></div>
            </div>
          </div>
        </div>
      `;
          }

          // type==="sow"
          const s = get.sow(id);
          if (!s) return "";
          const st = profitStatsForSow(id);
          const profitTag =
            st.profitEst >= 0
              ? `<span class="tag ok">Utilidad: <span class="mono">${fmtCOP(st.profitEst)}</span></span>`
              : `<span class="tag bad">Pérdida: <span class="mono">${fmtCOP(st.profitEst)}</span></span>`;
          const rows = st.per
            .slice(0, 30)
            .map((x) => {
              const b = x.batch;
              const tag =
                x.profitEst >= 0
                  ? `<span class="tag ok">+${fmtCOP(x.profitEst)}</span>`
                  : `<span class="tag bad">${fmtCOP(x.profitEst)}</span>`;
              return `<tr>
        <td class="mono">${esc(b.birthDate || "—")}</td>
        <td><b>${esc(b.code || "Lote " + b.id.slice(-6))}</b><div class="muted">Disponibles: ${esc(b.countCurrent || 0)}</div></td>
        <td class="mono">${esc(x.qtySold || 0)}</td>
        <td class="mono">${esc(fmtCOP(x.sold))}</td>
        <td class="mono">${esc(fmtCOP(x.collected))}</td>
        <td class="mono">${esc(fmtCOP(x.pending))}</td>
        <td class="mono">${esc(fmtCOP(x.cost))}</td>
        <td>${tag}</td>
        <td><button class="btn" data-act="viewBatch" data-id="${b.id}">Ver</button></td>
      </tr>`;
            })
            .join("");

          return `
      <div class="card">
        <div class="hd">
          <div><h2>Ganancias por camadas</h2><p>Lo que produce esta cerda</p></div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            ${profitTag}
            <span class="tag info">Inv. cerda: <span class="mono">${fmtCOP(st.costS)}</span></span>
            <span class="tag info">Inv. camadas: <span class="mono">${fmtCOP(st.costB)}</span></span>
          </div>
        </div>
        <div class="bd">
          <div class="kpis">
            <div class="kpi"><small>Lechones vendidos</small><b class="mono">${esc(st.qtySold || 0)}</b></div>
            <div class="kpi"><small>Total vendido</small><b class="mono">${fmtCOP(st.sold)}</b></div>
            <div class="kpi"><small>Cobrado</small><b class="mono">${fmtCOP(st.collected)}</b></div>
            <div class="kpi"><small>Pendiente</small><b class="mono">${fmtCOP(st.pending)}</b></div>
          </div>

          <div class="wrap"><table>
            <thead><tr><th>Nacimiento</th><th>Camada</th><th>Vend.</th><th>Total</th><th>Cobrado</th><th>Pend.</th><th>Inv.</th><th>Utilidad</th><th></th></tr></thead>
            <tbody>${rows || `<tr><td colspan="9" class="muted">Aún no hay camadas o ventas para esta cerda.</td></tr>`}</tbody>
          </table></div>

          <div class="emptyBig">
            <b>Cómo se calcula</b>
            <div class="muted">Utilidad estimada = Total vendido − (inversión cerda + inversión de sus camadas).</div>
            <div class="muted" style="margin-top:6px">Si quieres, luego podemos agregar costos adicionales (mano de obra, servicios, etc.).</div>
          </div>
        </div>
      </div>
    `;
        }

        const defaults = () => ({
          settings: {
            farmName: "Granja Porcícola Campo Bello",
            currency: "COP",
            gestationDays: 115,
            serviceMethods: ["inseminación", "monta", "otro"],
          },
          sows: [],
          breedings: [],
          farrowings: [],
          batches: [],
          inventory: [],
          stockMovements: [],
          clients: [],
          sales: [],
          payments: [],
          meat: { stockKg: 0, headsForSale: 0, movements: [] },
          meatSales: [],
          meatPayments: [],
          transactions: [],
          payables: [],
          tasks: [],
        });

        let state = load();
        // auditState() se ejecuta luego de inicializar 'get'
        function load() {
          try {
            const r = storage.getItem(KEY);
            return r ? Object.assign(defaults(), JSON.parse(r)) : defaults();
          } catch {
            return defaults();
          }
        }
        function save() {
          auditState();
          storage.setItem(KEY, JSON.stringify(state));
          if (typeof renderNavBadges === "function") renderNavBadges();
        }

        function toast(type, title, msg) {
          const el = document.createElement("div");
          el.className = "t " + (type || "");
          el.innerHTML = `<div style="font-weight:900;font-size:13px">${esc(title)}</div><div class="muted" style="margin-top:4px;font-size:12px">${esc(msg || "")}</div>`;
          $("#toast").appendChild(el);
          setTimeout(() => {
            el.style.opacity = "0";
            el.style.transform = "translateY(6px)";
          }, 2600);
          setTimeout(() => el.remove(), 3400);
        }

        // ------- Modal (dialog) -------
        const dlg = $("#dlg"),
          dlgTitle = $("#dlgTitle"),
          dlgSub = $("#dlgSub"),
          dlgBody = $("#dlgBody"),
          dlgFt = $("#dlgFt");
        const dlg2 = $("#dlg2"),
          dlg2Title = $("#dlg2Title"),
          dlg2Sub = $("#dlg2Sub"),
          dlg2Body = $("#dlg2Body"),
          dlg2Ft = $("#dlg2Ft");

        $("#dlgClose").onclick = () => dlg.close();
        dlg.addEventListener("click", (e) => {
          if (e.target === dlg) dlg.close();
        });
        function openModal({ title, sub, body, footer, onMount }) {
          dlgTitle.textContent = title || "";
          dlgSub.textContent = sub || "";
          dlgBody.innerHTML = body || "";
          dlgFt.innerHTML =
            footer || `<button class="btn" id="mClose">Cerrar</button>`;
          dlg.showModal();
          bindMoneyInputs(dlg);
          const c = $("#mClose", dlgFt);
          if (c) c.onclick = () => dlg.close();
          if (typeof onMount === "function") onMount();
          bindMoneyInputs(dlg);
        }

        function openAlert({
          title = "Atención",
          sub = "",
          message = "",
          kind = "bad",
        }) {
          // Modal ligero para avisos. Si el navegador no soporta showModal (o falla), usamos toast.
          try {
            if (!dlg2 || typeof dlg2.showModal !== "function")
              return toast(kind, title, message || sub || "");
            dlg2Title.textContent = title;
            dlg2Sub.textContent = sub || "";
            const boxClass = kind === "ok" ? "alertBox ok" : "alertBox";
            dlg2Body.innerHTML = `<div class="${boxClass}"><b>${esc(title)}</b><div class="muted" style="margin-top:6px">${esc(message || sub || "")}</div></div>`;
            dlg2Ft.innerHTML = `<button class="btn primary" id="aOk">Entendido</button>`;
            if (!dlg2.open) dlg2.showModal();
            const close = () => dlg2.close();
            const x = $("#dlg2Close");
            if (x) x.onclick = close;
            const ok = $("#aOk", dlg2Ft);
            if (ok) ok.onclick = close;
          } catch (err) {
            toast(kind, title, message || sub || "");
          }
        }

        // ------- Ayuda + Onboarding -------
        const ONBOARD_KEY = KEY + "_onboard_seen";

        function gettingStartedCardHTML() {
          const steps = [
            {
              k: "sows",
              ico: "🐷",
              title: "Registra tu primera cerda",
              desc: "Crea el registro maestro (Arete/Tag).",
              done: state.sows.length > 0,
              act: "Crear cerda",
              on: "sow",
            },
            {
              k: "breed",
              ico: "🧬",
              title: "Registra un servicio/inseminación",
              desc: "Así el sistema calcula parto estimado y crea tareas.",
              done: state.breedings.length > 0,
              act: "Registrar servicio",
              on: "breeding",
            },
            {
              k: "litt",
              ico: "👶",
              title: "Registra un parto (camada)",
              desc: "Crea camadas y lechones disponibles para vender.",
              done: state.farrowings.length > 0 || state.batches.length > 0,
              act: "Registrar parto",
              on: "farrowing",
            },
            {
              k: "inv",
              ico: "📦",
              title: "Crea inventario (insumos)",
              desc: "Alimento/medicamento con mínimos y vencimiento.",
              done: state.inventory.length > 0,
              act: "Nuevo insumo",
              on: "inv",
            },
            {
              k: "sales",
              ico: "💳",
              title: "Registra una venta",
              desc: "Vende lechones por camada y controla abonos/saldo.",
              done: state.sales.length > 0,
              act: "Nueva venta",
              on: "sale",
            },
          ];
          const doneCount = steps.filter((s) => s.done).length;
          if (doneCount === steps.length) return "";
          return `
      <div class="helpCard" id="gsCard">
        <div class="helpHd">
          <div>
            <b>Primeros pasos (para que el sistema “arranque”)</b>
            <div class="muted">Completa estos pasos y el Dashboard empezará a mostrar alertas, lechones disponibles y cartera.</div>
          </div>
          <span class="tag info">${doneCount}/${steps.length} completados</span>
        </div>
        <div class="steps">
          ${steps
            .map(
              (s) => `
            <div class="step ${s.done ? "done" : ""}">
              <div class="left">
                <div class="ico">${s.done ? "✅" : s.ico}</div>
                <div class="txt">
                  <b>${esc(s.title)}</b>
                  <div class="muted">${esc(s.desc)}</div>
                </div>
              </div>
              <div class="right">
                ${
                  s.done
                    ? `<span class="tag ok">Listo</span>`
                    : `
                  <button class="btn primary" data-gs="${s.on}">${esc(s.act)}</button>
                  <button class="btn" data-goto="${s.k}">Ir al módulo</button>
                `
                }
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    `;
        }

        function bindGettingStartedActions(root = document) {
          root.querySelectorAll("button[data-goto]").forEach((b) => {
            b.onclick = () => goTab(b.dataset.goto);
          });
          root.querySelectorAll("button[data-gs]").forEach((b) => {
            const t = b.dataset.gs;
            b.onclick = () => {
              dlg.close();
              if (t === "sow") openSow();
              if (t === "breeding") openBreeding();
              if (t === "farrowing") openFarrowing();
              if (t === "inv") openInvItem();
              if (t === "sale") openSale();
            };
          });
        }

        function openHelp() {
          openModal({
            title: "Ayuda rápida",
            sub: "Guía dentro del sistema (sin internet).",
            body: `
        <div class="helpCard" style="margin-top:0">
          <div class="helpHd">
            <div>
              <b>¿Por dónde empezar?</b>
              <div class="muted">Si es tu primera vez, abre “Primeros pasos” y sigue el checklist.</div>
            </div>
            <span class="tag info">Tip</span>
          </div>
          <div class="actions" style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn primary" id="openOnb">📘 Primeros pasos</button>
            <button class="btn" id="goSettings">⚙️ Ajustes</button>
            <button class="btn" id="goBackup">🧾 Exportar respaldo</button>
          </div>
        </div>

        <div class="wrap">
          <table>
            <thead><tr><th>Acción</th><th>Qué hace</th><th>Atajo</th></tr></thead>
            <tbody>
              <tr><td><b>➕ Rápido</b></td><td class="muted">Crea cerda/servicio/parto/insumo/gasto/tarea sin cambiar de módulo.</td><td class="mono">Header</td></tr>
              <tr><td><b>Buscar</b></td><td class="muted">Busca por tag, cliente, insumo, venta… y filtra la vista actual.</td><td class="mono">Caja de búsqueda</td></tr>
              <tr><td><b>Abonos</b></td><td class="muted">Registra pagos parciales y mira historial de cobros.</td><td class="mono">Ventas → Ver</td></tr>
              <tr><td><b>Respaldos</b></td><td class="muted">Exporta/Importa JSON para no perder datos (recomendado semanal).</td><td class="mono">Ajustes</td></tr>
            </tbody>
          </table>
        </div>

        <div class="emptyBig">
          <b>Flujo recomendado</b>
          <div class="muted">Cerda → Servicio → Parto (Camada) → Venta → Abonos → Finanzas</div>
        </div>
      `,
            footer: `<button class="btn" id="hClose">Cerrar</button>`,
            onMount: () => {
              $("#hClose", dlgFt).onclick = () => dlg.close();
              $("#openOnb").onclick = () => {
                dlg.close();
                openOnboarding(true);
              };
              $("#goSettings").onclick = () => {
                dlg.close();
                goTab("settings");
              };
              $("#goBackup").onclick = () => {
                dlg.close();
                goTab("settings");
                setTimeout(() => $("#expAll")?.click(), 180);
              };
            },
          });
        }

        function openOnboarding(force = false) {
          if (!force && storage.getItem(ONBOARD_KEY) === "1") return;
          const body = `
      <div class="helpCard" style="margin-top:0">
        <div class="helpHd">
          <div>
            <b>Primeros pasos</b>
            <div class="muted">Completa el checklist y empieza a registrar tu operación.</div>
          </div>
          <span class="tag info">Checklist</span>
        </div>
        ${gettingStartedCardHTML() || `<div class="emptyBig"><b>¡Listo!</b><div class="muted">Ya completaste lo básico. Ahora usa Inventario, Ventas y Finanzas día a día.</div></div>`}
      </div>

      <div class="emptyBig">
        <b>Consejo importante</b>
        <div class="muted">Este sistema guarda datos en tu navegador. Haz <b>Exportar JSON</b> cada semana (Ajustes).</div>
      </div>
    `;
          openModal({
            title: "📘 Primeros pasos",
            sub: "Checklist dentro del sistema.",
            body,
            footer: `<button class="btn" id="obClose">Cerrar</button>
              <button class="btn" id="obNo">No mostrar de nuevo</button>`,
            onMount: () => {
              $("#obClose", dlgFt).onclick = () => dlg.close();
              $("#obNo", dlgFt).onclick = () => {
                storage.setItem(ONBOARD_KEY, "1");
                dlg.close();
                toast("ok", "Listo", "No volverá a mostrarse automáticamente.");
              };
              bindGettingStartedActions(dlgBody);
            },
          });
        }

        function maybeOnboard() {
          const isEmpty =
            state.sows.length === 0 &&
            state.inventory.length === 0 &&
            state.sales.length === 0 &&
            state.breedings.length === 0 &&
            state.farrowings.length === 0;
          if (isEmpty) openOnboarding(false);
        }

        // ------- Data helpers -------
        const get = {
          sow: (id) => state.sows.find((x) => x.id === id) || null,
          breeding: (id) => state.breedings.find((x) => x.id === id) || null,
          batch: (id) => state.batches.find((x) => x.id === id) || null,
          inv: (id) => state.inventory.find((x) => x.id === id) || null,
          client: (id) => state.clients.find((x) => x.id === id) || null,
          sale: (id) => state.sales.find((x) => x.id === id) || null,
          meatSale: (id) =>
            (state.meatSales || []).find((x) => x.id === id) || null,
          payable: (id) =>
            (state.payables || []).find((x) => x.id === id) || null,
        };

        // ------- Auditoría / normalización del estado (evita errores) -------

        // ------- Migración (compatibilidad con versiones anteriores) -------
        function migrateLegacy() {
          // batches / camadas
          (state.batches || []).forEach((b) => {
            if (b.birthDate == null && b.date != null) b.birthDate = b.date;
            if (b.countInitial == null) {
              if (b.countBornAlive != null)
                b.countInitial = num(b.countBornAlive);
              else if (b.bornAlive != null) b.countInitial = num(b.bornAlive);
              else if (b.alive != null) b.countInitial = num(b.alive);
            }
            if (b.countCurrent == null) {
              if (b.countInitial != null) b.countCurrent = num(b.countInitial);
            }
            if (b.status == null || b.status === "") {
              b.status = num(b.countCurrent) > 0 ? "disponible" : "cerrado";
            }
          });

          // farrowings / partos
          (state.farrowings || []).forEach((f) => {
            if (f.date == null && f.farrowingDate != null)
              f.date = f.farrowingDate;
            if (f.bornAlive == null && f.bornTotal != null) {
              f.bornAlive = Math.max(
                0,
                num(f.bornTotal) - num(f.stillborn || 0),
              );
            }
          });

          // inventory
          (state.inventory || []).forEach((i) => {
            if (i.unitCost == null && i.costUnit != null)
              i.unitCost = num(i.costUnit);
            if (i.minQty == null && i.min != null) i.minQty = num(i.min);
          });

          // sales
          (state.sales || []).forEach((s) => {
            if (s.unitPrice == null && s.price != null)
              s.unitPrice = num(s.price);
            if (s.paidAmount == null && s.paid != null)
              s.paidAmount = num(s.paid);
            if (s.status == null || s.status === "") {
              const total = num(s.total);
              const paid = num(s.paidAmount);
              const pending = Math.max(0, total - paid);
              s.status =
                pending <= 0 ? "pagado" : paid > 0 ? "parcial" : "credito";
            }
          });
        }

        function normalizeState() {
          migrateLegacy();
          state.sows = state.sows || [];
          state.breedings = state.breedings || [];
          state.farrowings = state.farrowings || [];
          state.batches = state.batches || [];
          state.inventory = state.inventory || [];
          state.stockMovements = state.stockMovements || [];
          state.clients = state.clients || [];
          state.sales = state.sales || [];
          state.payments = state.payments || [];
          state.meat = state.meat || {
            stockKg: 0,
            headsForSale: 0,
            movements: [],
          };
          state.meatSales = state.meatSales || [];
          state.meatPayments = state.meatPayments || [];
          state.transactions = state.transactions || [];
          state.payables = state.payables || [];
          state.tasks = state.tasks || [];
          state.settings = state.settings || defaults().settings;
          // Migración: nombre de granja por defecto
          if (
            !state.settings.farmName ||
            state.settings.farmName === "Granja Porcina"
          )
            state.settings.farmName = "Granja Porcícola Campo Bello";
          state.settings.serviceMethods = state.settings.serviceMethods || [
            "inseminación",
            "monta",
            "otro",
          ];
        }

        function auditState() {
          normalizeState();

          // Reconciliar abonos: sale.paidAmount = suma de payments (si existen)
          const paySumBySale = new Map();
          (state.payments || []).forEach((p) => {
            const sid = (p.saleId || "").toString();
            if (!sid) return;
            const a = num(p.amount);
            paySumBySale.set(sid, (paySumBySale.get(sid) || 0) + a);
          });

          const hasGet = typeof get !== "undefined";
          // Ajustes / métodos de servicio
          state.settings = state.settings || defaults().settings;
          const baseMethods = ["inseminación", "monta", "otro"];
          state.settings.serviceMethods = (
            state.settings.serviceMethods || baseMethods
          )
            .map((x) => String(x ?? "").trim())
            .filter(Boolean);
          // asegurar base y evitar duplicados (case-insensitive)
          const uniq = [];
          [...state.settings.serviceMethods, ...baseMethods].forEach((x) => {
            const k = x.toLowerCase();
            if (!uniq.some((u) => u.toLowerCase() === k)) uniq.push(x);
          });
          state.settings.serviceMethods = uniq;

          state.inventory.forEach((i) => {
            i.qty = Math.max(0, num(i.qty));
            i.minQty = Math.max(0, num(i.minQty));
            i.unitCost = Math.max(0, num(i.unitCost));
          });

          state.batches.forEach((b) => {
            // Compatibilidad: algunas versiones usan countInitial, otras countBornAlive
            const born =
              b.countInitial != null ? b.countInitial : b.countBornAlive;
            b.countInitial = Math.max(0, num(born));
            b.countBornAlive = b.countInitial; // alias interno
            b.countCurrent = Math.max(0, num(b.countCurrent));
            if (b.countCurrent > b.countInitial)
              b.countCurrent = b.countInitial;

            // Fechas sugeridas (destete 25 días, engorde 48 días)
            if (b.birthDate) {
              b.weaningDate = b.weaningDate || addDays(b.birthDate, 25);
              b.engordeDate = b.engordeDate || addDays(b.birthDate, 48);
            }

            // Estado: no forzar "cerrado" por defecto si falta información
            if (!b.status) b.status = "disponible";
            // Auto-cerrar solo cuando hay cantidad inicial registrada y ya no queda stock
            if (
              b.countInitial > 0 &&
              b.countCurrent <= 0 &&
              (b.status === "disponible" || !b.status)
            )
              b.status = "cerrado";
          });

          // ---- Engorde automático (48 días): lo no vendido pasa a Carne ----
          const tNow = today();
          let autoHeads = 0;
          let movedNow = 0;

          state.batches.forEach((b) => {
            // acumular ya movidos
            if (b.movedToMeat) autoHeads += Math.max(0, num(b.movedToMeatQty));
            if (!b.birthDate) return;

            const age = daysBetween(b.birthDate, tNow);
            if (age >= 48 && !b.movedToMeat && num(b.countCurrent) > 0) {
              const qty = Math.max(0, num(b.countCurrent));
              b.movedToMeat = true;
              b.movedToMeatQty = qty;
              b.movedToMeatDate = tNow;
              b.status = "engorde";
              b.countCurrent = 0;
              movedNow += qty;
              autoHeads += qty;
            }
          });

          state.meat = state.meat || {
            stockKg: 0,
            headsForSale: 0,
            headsManual: 0,
            movements: [],
          };
          // migración: versiones viejas tenían solo headsForSale (manual)
          if (state.meat.headsManual == null) {
            state.meat.headsManual = num(state.meat.headsForSale);
          }
          state.meat.headsAuto = autoHeads;
          state.meat.headsForSale = Math.max(
            0,
            autoHeads + num(state.meat.headsManual),
          );

          if (movedNow > 0) {
            state.meat.movements = state.meat.movements || [];
            state.meat.movements.push({
              id: uid("mmv"),
              date: tNow,
              type: "engorde_auto",
              heads: movedNow,
              notes: "Transferencia automática desde camadas (48 días).",
            });
          }

          state.sales.forEach((s) => {
            s.qty = Math.max(0, num(s.qty));
            s.unitPrice = Math.max(0, num(s.unitPrice));
            s.total = Math.max(0, num(s.total) || s.qty * s.unitPrice);
            s.paidAmount = Math.max(0, Math.min(s.total, num(s.paidAmount)));
            if (!s.status)
              s.status =
                s.paidAmount >= s.total
                  ? "pagado"
                  : s.paidAmount > 0
                    ? "parcial"
                    : "credito";
            if (!s.sowId && s.batchId && hasGet) {
              const b = get.batch(s.batchId);
              if (b?.sowId) s.sowId = b.sowId;
            }

            // Reconciliar con historial de pagos (si hay registros)
            if (paySumBySale.has(s.id)) {
              const ps = paySumBySale.get(s.id) || 0;
              s.paidAmount = Math.min(num(s.total), Math.max(0, ps));
            }
            const pending2 = Math.max(0, num(s.total) - num(s.paidAmount));
            s.status =
              pending2 <= 0
                ? "pagado"
                : num(s.paidAmount) > 0
                  ? "parcial"
                  : "credito";
          });

          (state.payables || []).forEach((p) => {
            p.total = Math.max(0, num(p.total));
            p.paid = Math.max(0, Math.min(p.total, num(p.paid)));
            if (p.paid >= p.total - 0.0001) p.status = "cerrado";
            if (!p.status)
              p.status = p.paid >= p.total - 0.0001 ? "cerrado" : "abierto";
          });

          state.tasks.forEach((t) => {
            if (t.done === undefined) t.done = false;
            if (!t.priority) t.priority = "media";
          });

          state.stockMovements.forEach((m) => {
            m.qty = Math.max(0, num(m.qty));
            if ((m.unitCost === undefined || m.unitCost === null) && hasGet) {
              const it = get.inv(m.itemId);
              m.unitCost = num(it?.unitCost) || 0;
            } else {
              m.unitCost = Math.max(0, num(m.unitCost));
            }
          });

          // Carne / ventas por kilos
          state.meat = state.meat || {
            stockKg: 0,
            headsForSale: 0,
            movements: [],
          };
          state.meat.stockKg = Math.max(0, num(state.meat.stockKg));
          state.meat.headsForSale = Math.max(0, num(state.meat.headsForSale));
          state.meat.movements = state.meat.movements || [];

          state.meatSales = state.meatSales || [];
          state.meatPayments = state.meatPayments || [];

          state.meatSales.forEach((s) => {
            s.qty = Math.max(0, num(s.qty)); // kg
            s.unitPrice = Math.max(0, num(s.unitPrice)); // COP/kg
            s.total = Math.max(0, num(s.total) || s.qty * s.unitPrice);
            s.paidAmount = Math.max(0, Math.min(s.total, num(s.paidAmount)));
            if (!s.status)
              s.status =
                s.paidAmount >= s.total
                  ? "pagado"
                  : s.paidAmount > 0
                    ? "parcial"
                    : "credito";
          });
        }

        function getWarnings() {
          normalizeState();
          const list = [];
          const todayS = today();

          const tags = state.sows
            .map((s) => (s.tag || "").trim())
            .filter(Boolean);
          const dup = [
            ...new Set(tags.filter((t, i) => tags.indexOf(t) !== i)),
          ];
          if (dup.length) {
            list.push({
              level: "bad",
              title: "Tags duplicados",
              detail: `Corrige: ${dup.slice(0, 6).join(", ")}${dup.length > 6 ? "…" : ""}`,
              tab: "sows",
            });
          }

          const low = state.inventory.filter(
            (i) => num(i.qty) <= num(i.minQty) && (i.name || "").trim(),
          );
          if (low.length) {
            list.push({
              level: "warn",
              title: "Stock bajo",
              detail: `${low.length} insumo(s) por debajo del mínimo.`,
              tab: "inv",
            });
          }

          const expSoon = state.inventory
            .filter((i) => i.expiration)
            .map((i) => ({ i, d: daysBetween(todayS, i.expiration) }))
            .filter((x) => x.d !== null && x.d >= 0 && x.d <= 30);
          if (expSoon.length) {
            list.push({
              level: "warn",
              title: "Vencimientos próximos",
              detail: `${expSoon.length} insumo(s) vencen en ≤ 30 días.`,
              tab: "inv",
            });
          }

          const pending = state.tasks.filter((t) => !t.done && t.dueDate);
          const overdue = pending.filter(
            (t) => daysBetween(t.dueDate, todayS) > 0,
          );
          const dueSoon = pending.filter((t) => {
            const d = daysBetween(todayS, t.dueDate);
            return d !== null && d >= 0 && d <= 7;
          });
          if (overdue.length)
            list.push({
              level: "bad",
              title: "Tareas vencidas",
              detail: `${overdue.length} tarea(s) atrasadas.`,
              tab: "tasks",
            });
          if (dueSoon.length)
            list.push({
              level: "warn",
              title: "Tareas por vencer",
              detail: `${dueSoon.length} tarea(s) en los próximos 7 días.`,
              tab: "tasks",
            });

          const openP = (state.payables || []).filter(
            (p) => (p.status || "abierto") !== "cerrado",
          );
          const payOver = openP.filter(
            (p) => p.dueDate && daysBetween(p.dueDate, todayS) > 0,
          );
          if (payOver.length)
            list.push({
              level: "warn",
              title: "Cuentas por pagar vencidas",
              detail: `${payOver.length} compra(s) con vencimiento pasado.`,
              tab: "finance",
            });

          const badB = state.batches.filter(
            (b) => num(b.countCurrent) <= 0 && (b.status || "") !== "cerrado",
          );
          if (badB.length)
            list.push({
              level: "info",
              title: "Camadas por cerrar",
              detail: `${badB.length} camada(s) sin stock pero abiertas.`,
              tab: "batches",
            });

          // Ventas huérfanas (camada/cerda eliminada)
          const batchIds = new Set(state.batches.map((b) => b.id));
          const sowIds = new Set(state.sows.map((s) => s.id));
          const orphanSales = state.sales.filter(
            (s) => !batchIds.has(s.batchId) || !sowIds.has(s.sowId),
          );
          if (orphanSales.length) {
            list.push({
              level: "warn",
              title: "Ventas con referencias faltantes",
              detail: `${orphanSales.length} venta(s) apuntan a cerda/camada que ya no existe.`,
              tab: "sales",
            });
          }

          // Camadas con sobreventa
          const oversold = state.batches.filter((b) => {
            const soldQty = (state.sales || [])
              .filter((s) => s.batchId === b.id)
              .reduce((a, s) => a + num(s.qty), 0);
            const born = num(b.countInitial) || num(b.countBornAlive) || 0;
            return born > 0 && soldQty > born + 0.0001;
          });
          if (oversold.length) {
            list.push({
              level: "bad",
              title: "Camadas sobrevendidas",
              detail: `${oversold.length} camada(s) tienen ventas mayores al nacidos vivos. Revisa registros.`,
              tab: "batches",
            });
          }

          // Cerdas con gestación vencida sin parto
          const gestDays = num(state.settings.gestationDays) || 115;
          const closed = new Set(
            state.farrowings.map((f) => f.breedingId).filter(Boolean),
          );
          const overduePreg = state.breedings.filter((b) => {
            if (!b.sowId || !b.date) return false;
            if (closed.has(b.id)) return false;
            return daysBetween(addDays(b.date, gestDays), todayS) > 0;
          });
          if (overduePreg.length) {
            list.push({
              level: "warn",
              title: "Gestaciones vencidas",
              detail: `${overduePreg.length} servicio(s) ya pasaron la fecha estimada de parto.`,
              tab: "breed",
            });
          }

          return list;
        }

        function renderWarningsPanel() {
          const ws = getWarnings();
          if (!ws.length) return "";
          return `<div class="helpCard" style="margin-top:10px">
      <div class="helpHd">
        <div>
          <b>Alertas y pendientes</b>
          <div class="muted">Revisa estos avisos para evitar errores de operación.</div>
        </div>
        <span class="tag info">${ws.length} aviso(s)</span>
      </div>
      <div class="steps">
        ${ws
          .map(
            (w) => `
          <div class="step ${w.level === "bad" ? "" : "done"}">
            <div class="left">
              <div class="ico">${w.level === "bad" ? "⛔" : w.level === "warn" ? "⚠️" : "ℹ️"}</div>
              <div class="txt">
                <b>${esc(w.title)}</b>
                <div class="muted">${esc(w.detail || "")}</div>
              </div>
            </div>
            <div class="right">
              <button class="btn primary" data-wtab="${esc(w.tab || "dashboard")}">Ver</button>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>`;
        }

        function renderNavBadges() {
          const ws = getWarnings();
          const wb = $("#warnBadge");
          if (wb) {
            wb.style.display = ws.length ? "inline-flex" : "none";
            wb.textContent = ws.length;
          }
        }

        // Auditoría inicial (ya existe 'get')
        auditState();
        renderNavBadges();

        function pregnantBreedings() {
          const closed = new Set(
            state.farrowings.map((f) => f.breedingId).filter(Boolean),
          );
          return state.breedings.filter((b) => !closed.has(b.id));
        }
        function pigletsAvailable() {
          return state.batches
            .filter((b) => (b.status || "disponible") !== "cerrado")
            .reduce((s, b) => s + num(b.countCurrent), 0);
        }
        function lowStock() {
          return state.inventory.filter(
            (i) => num(i.qty) <= num(i.minQty || 0),
          );
        }
        function receivables() {
          return state.sales
            .map((s) => ({
              s,
              pending: Math.max(0, num(s.total) - num(s.paidAmount)),
            }))
            .filter((x) => x.pending > 0);
        }
        function sumMonth(type) {
          const m = today().slice(0, 7);
          return state.transactions
            .filter(
              (t) => t.type === type && String(t.date || "").slice(0, 7) === m,
            )
            .reduce((s, t) => s + num(t.amount), 0);
        }

        // ------- UI Nav -------
        const tabs = [
          ["dashboard", "📊 Dashboard"],
          ["sows", "🐷 Cerdas"],
          ["meat", "🥩 Carne (Kg)"],
          ["breed", "🧬 Reproducción"],
          ["litters", "👶 Camadas"],
          ["inv", "📦 Inventario"],
          ["sales", "💳 Ventas"],
          ["finance", "💰 Finanzas"],
          ["tasks", "⏰ Tareas"],
          ["settings", "⚙️ Ajustes"],
        ];
        let current = "dashboard",
          q = "";
        function goTab(tab) {
          current = tab;
          renderNav();
          render();
        }
        function renderNav() {
          $("#nav").innerHTML = tabs
            .map(
              ([id, label]) =>
                `<button data-tab="${id}" class="${id === current ? "active" : ""}">${label}</button>`,
            )
            .join("");
          $("#nav").onclick = (e) => {
            const b = e.target.closest("button[data-tab]");
            if (!b) return;
            current = b.dataset.tab;
            renderNav();
            render();
          };
        }
        function renderNavBadges() {
          $("#farmName").textContent =
            state.settings.farmName || "Granja Porcícola Campo Bello";
        }

        $("#q").addEventListener("input", (e) => {
          q = (e.target.value || "").trim().toLowerCase();
          render();
        });
        function matchQ(...fields) {
          if (!q) return true;
          const s = fields
            .map((x) => String(x ?? "").toLowerCase())
            .join(" | ");
          return s.includes(q);
        }

        // ------- Main render -------
        const view = $("#view");
        function shell(title, sub, actions, body) {
          return `<div class="grid">
      <div class="card">
        <div class="hd">
          <div><h2>${esc(title)}</h2><p>${esc(sub || "")}</p></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">${actions || ""}</div>
        </div>
        <div class="bd">${body || ""}</div>
      </div>
    </div>`;
        }

        function render() {
          renderNavBadges();
          if (current === "dashboard") renderDashboard();
          else if (current === "sows") renderSows();
          else if (current === "breed") renderBreedings();
          else if (current === "litters") renderLitters();
          else if (current === "inv") renderInventory();
          else if (current === "sales") renderSales();
          else if (current === "meat") renderMeat();
          else if (current === "finance") renderFinance();
          else if (current === "tasks") renderTasks();
          else if (current === "settings") renderSettings();
          bindMoneyInputs(view);
        }

        // ------- Dashboard -------
        function renderDashboard() {
          const preg = pregnantBreedings();
          const upcoming = preg
            .map((b) => ({
              b,
              s: get.sow(b.sowId),
              inDays: b.expectedFarrowing
                ? daysBetween(today(), b.expectedFarrowing)
                : null,
            }))
            .filter(
              (x) =>
                x.s && x.inDays !== null && x.inDays >= 0 && x.inDays <= 14,
            )
            .sort((a, b) => a.inDays - b.inDays);

          const inc = sumMonth("ingreso"),
            exp = sumMonth("gasto"),
            net = inc - exp;
          const alerts = [];
          upcoming.forEach((x) =>
            alerts.push({
              t: "warn",
              a: "Parto cercano",
              d: `${x.s.tag || x.s.name || "cerda"} • ${x.b.expectedFarrowing} (${x.inDays} días)`,
            }),
          );
          lowStock()
            .slice(0, 6)
            .forEach((i) =>
              alerts.push({
                t: "bad",
                a: "Stock bajo",
                d: `${i.name} • ${i.qty} ${i.unit} (mín ${i.minQty || 0})`,
              }),
            );
          receivables()
            .slice(0, 6)
            .forEach((x) =>
              alerts.push({
                t: "warn",
                a: "Cobro pendiente",
                d: `${get.client(x.s.clientId)?.name || "cliente"} • ${fmtCOP(x.pending)} • ${x.s.date}`,
              }),
            );

          const kpis = `<div class="kpis">
      <div class="kpi"><small>Cerdas</small><b>${state.sows.length}</b><div class="muted mono">Registro maestro</div></div>
      <div class="kpi"><small>Gestaciones abiertas</small><b>${preg.length}</b><div class="muted mono">Servicios sin parto</div></div>
      <div class="kpi"><small>Lechones disponibles</small><b>${pigletsAvailable()}</b><div class="muted mono">Suma camadas</div></div>
      <div class="kpi"><small>Flujo del mes</small><b>${fmtCOP(net)}</b><div class="muted mono">${fmtCOP(inc)} - ${fmtCOP(exp)}</div></div>
    </div>`;

          const alertsHTML = alerts.length
            ? `<div class="wrap" style="margin-top:12px">
      <table><thead><tr><th>Tipo</th><th>Detalle</th><th class="mono">Acción</th></tr></thead>
      <tbody>${alerts
        .map(
          (x) => `<tr>
        <td><span class="tag ${x.t}">${x.t === "bad" ? "Crítico" : x.t === "warn" ? "Atención" : "Info"}</span></td>
        <td><b>${esc(x.a)}</b><div class="muted">${esc(x.d)}</div></td>
        <td>
          ${
            x.a === "Stock bajo"
              ? `<button class="btn" data-go="inv">Inventario</button>`
              : x.a === "Cobro pendiente"
                ? `<button class="btn" data-go="sales">Ventas</button>`
                : `<button class="btn" data-go="breed">Reproducción</button>`
          }
        </td>
      </tr>`,
        )
        .join("")}</tbody></table></div>`
            : `<div class="muted" style="margin-top:10px">Sin alertas por ahora.</div>`;

          const gs = gettingStartedCardHTML();
          const wp = renderWarningsPanel();

          view.innerHTML = shell(
            "Dashboard",
            "Vista rápida con métricas y alertas automáticas.",
            `<button class="btn" id="dashFeedSows">🍽️ Alimentar cerdas</button>
       <button class="btn" id="dashFeedBatches">🍽️ Alimentar camadas</button>
       <button class="btn primary" id="addSow">➕ Nueva cerda</button>
       <button class="btn" id="addInv">📦 Nuevo insumo</button>
       ${
         state.inventory.length
           ? `<button class="btn" id="dashIn">➕ Entrada</button>
       <button class="btn" id="dashOut">➖ Salida</button>`
           : ""
       }
       <button class="btn" id="addBreeding">🧬 Servicio</button>
       <button class="btn" id="addFarrowing">👶 Parto</button>
       <button class="btn" id="startGuide">📘 Primeros pasos</button>`,
            gs + wp + kpis + alertsHTML,
          );

          const fS = $("#dashFeedSows");
          if (fS) fS.onclick = () => openSupplySowPicker();
          const fB = $("#dashFeedBatches");
          if (fB) fB.onclick = () => openSupplyBatchPicker();

          $("#addSow").onclick = () => openSow();
          $("#addInv").onclick = () => openInvItem();
          const di = $("#dashIn");
          if (di) di.onclick = () => openInvMovePicker("entrada");
          const doo = $("#dashOut");
          if (doo) doo.onclick = () => openInvMovePicker("salida");
          $("#addBreeding").onclick = () => openBreeding();
          $("#addFarrowing").onclick = () => openFarrowing();
          const sg = $("#startGuide");
          if (sg) sg.onclick = () => openOnboarding(true);
          bindGettingStartedActions(view);
          view
            .querySelectorAll("button[data-wtab]")
            .forEach((b) => (b.onclick = () => goTab(b.dataset.wtab)));

          view.onclick = (e) => {
            const b = e.target.closest("button[data-go]");
            if (!b) return;
            current = b.dataset.go;
            renderNav();
            render();
          };
        }

        // ------- Sows -------
        function renderSows() {
          const closed = new Set(
            state.farrowings.map((f) => f.breedingId).filter(Boolean),
          );
          const rows = state.sows
            .filter((s) => matchQ(s.tag, s.name, s.breed, s.status, s.notes))
            .sort((a, b) => (a.tag || "").localeCompare(b.tag || ""))
            .map((s) => {
              const last = state.breedings
                .filter((b) => b.sowId === s.id)
                .sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0];
              const preg = last && !closed.has(last.id);
              const due = preg ? last.expectedFarrowing : "";
              const inD = due ? daysBetween(today(), due) : null;
              const inv = invested.sow(s.id);
              return `<tr>
          <td class="mono">${esc(s.tag || "—")}<div class="muted">${esc(s.name || "")}</div></td>
          <td>${esc(s.breed || "—")}<div class="muted">${esc(s.status || "activa")}</div></td>
          <td>${preg ? `<span class="tag warn">Preñada</span>` : `<span class="tag">—</span>`}</td>
          <td class="mono">${preg ? `${esc(due)} (${inD} días)` : "—"}</td>
          <td class="mono">${inv ? fmtCOP(inv) : "—"}</td>
          <td>
            <button class="btn" data-act="detail" data-id="${s.id}">Ver</button>
            <button class="btn" data-act="edit" data-id="${s.id}">Editar</button>
            <button class="btn danger" data-act="del" data-id="${s.id}">Eliminar</button>
          </td>
        </tr>`;
            })
            .join("");

          view.innerHTML = shell(
            "Cerdas",
            "Registro maestro de animales.",
            `<button class="btn primary" id="add">➕ Nueva cerda</button>
        <button class="btn" id="sowSupply">Suministrar producto</button>
       <button class="btn" id="svc">🧬 Registrar servicio</button>`,
            `<div class="wrap"><table>
        <thead><tr><th>Identificación</th><th>Raza/Estado</th><th>Gestación</th><th>Parto estimado</th><th>Inversión</th><th>Acciones</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="6" class="muted">Sin cerdas todavía.</td></tr>`}</tbody>
      </table></div>`,
          );

          $("#add").onclick = () => openSow();
          const sp = $("#sowSupply");
          if (sp) sp.onclick = () => openSupplySowPicker();
          $("#svc").onclick = () => openBreeding();

          view.onclick = (e) => {
            const b = e.target.closest("button[data-act]");
            if (!b) return;
            const id = b.dataset.id,
              act = b.dataset.act;
            if (act === "edit") openSow(id);
            if (act === "detail") sowDetail(id);
            if (act === "del") delSow(id);
          };
        }

        function sowForm(s) {
          s = s || {
            tag: "",
            name: "",
            breed: "",
            dob: "",
            status: "activa",
            notes: "",
          };
          return `<form id="sowForm" class="grid2">
      <div class="f3"><label>Arete/Tag *</label><input name="tag" required value="${esc(s.tag)}" placeholder="Ej: C-021"/></div>
      <div class="f3"><label>Nombre</label><input name="name" value="${esc(s.name)}"/></div>
      <div class="f3"><label>Raza</label><input name="breed" value="${esc(s.breed)}"/></div>
      <div class="f3"><label>Nacimiento</label><input type="date" name="dob" value="${esc(s.dob)}"/></div>
      <div class="f4"><label>Estado</label><select name="status">${["activa", "seca", "lactante", "vendida", "descartada", "muerta"].map((x) => `<option ${s.status === x ? "selected" : ""} value="${x}">${x}</option>`).join("")}</select></div>
      <div class="f12"><label>Notas</label><textarea name="notes">${esc(s.notes)}</textarea></div>
    </form>
`;
        }

        function openSow(id) {
          const s = id ? get.sow(id) : null;
          openModal({
            title: id ? "Editar cerda" : "Nueva cerda",
            sub: "Crea el registro base para reproducción y camadas.",
            body: sowForm(s),
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="save">Guardar</button>`,
            onMount: () => {
              $("#save").onclick = () => saveSow(id);
            },
          });
        }

        function saveSow(id) {
          const f = $("#sowForm");
          const fd = new FormData(f);
          const tag = (fd.get("tag") || "").toString().trim();
          if (!tag) {
            toast("bad", "Falta Tag", "El Tag es obligatorio.");
            return;
          }
          const dup = state.sows.find(
            (x) => x.tag?.toLowerCase() === tag.toLowerCase() && x.id !== id,
          );
          if (dup) {
            toast("bad", "Duplicado", "Ya existe ese Tag.");
            return;
          }
          const payload = {
            id: id || uid("sow"),
            tag,
            name: (fd.get("name") || "").toString().trim(),
            breed: (fd.get("breed") || "").toString().trim(),
            dob: (fd.get("dob") || "").toString(),
            status: (fd.get("status") || "activa").toString(),
            notes: (fd.get("notes") || "").toString().trim(),
          };
          if (id)
            state.sows = state.sows.map((x) => (x.id === id ? payload : x));
          else state.sows.push(payload);
          save();
          dlg.close();
          toast("ok", "Guardado", "Cerda guardada.");
          render();
        }

        function sowDetail(id) {
          const s = get.sow(id);
          if (!s) return;
          const br = state.breedings
            .filter((b) => b.sowId === id)
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
            .slice(0, 10);
          const fa = state.farrowings
            .filter((f) => f.sowId === id)
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
            .slice(0, 10);
          const ba = state.batches
            .filter((b) => b.sowId === id)
            .sort((a, b) =>
              (b.birthDate || "").localeCompare(a.birthDate || ""),
            )
            .slice(0, 10);
          openModal({
            title: `Cerda: ${s.tag || s.name || "—"}`,
            sub: "Historial rápido",
            body: `<div class="grid">
        <div class="card"><div class="bd">
          <div class="row"><div><div class="muted">Tag</div><b class="mono">${esc(s.tag || "—")}</b><div class="muted">${esc(s.name || "")}</div></div>
          <div><div class="muted">Raza/Estado</div><b>${esc(s.breed || "—")}</b><div class="muted">${esc(s.status || "activa")}</div></div>
          <div><div class="muted">Notas</div><div class="muted">${esc(s.notes || "—")}</div></div></div>
        </div></div>
        ${supplyHistoryHTML("sow", id)}
        ${profitHistoryHTML("sow", id)}
        <div class="card"><div class="hd"><div><h2>Reproducción</h2><p>Últimos 10</p></div></div><div class="bd">
          <div class="wrap"><table><thead><tr><th>Servicio</th><th>Método</th><th>Parto est.</th><th>Notas</th></tr></thead>
          <tbody>${br.map((b) => `<tr><td class="mono">${esc(b.date)}</td><td>${esc(b.method || "—")}</td><td class="mono">${esc(b.expectedFarrowing || "—")}</td><td class="muted">${esc(b.notes || "")}</td></tr>`).join("") || `<tr><td colspan="4" class="muted">Sin registros.</td></tr>`}</tbody></table></div>
        </div></div>
        <div class="card"><div class="hd"><div><h2>Partos</h2><p>Últimos 10</p></div></div><div class="bd">
          <div class="wrap"><table><thead><tr><th>Fecha</th><th>Total</th><th>Vivos</th><th>Muertos</th></tr></thead>
          <tbody>${fa.map((x) => `<tr><td class="mono">${esc(x.date)}</td><td class="mono">${esc(x.bornTotal)}</td><td class="mono">${esc(x.bornAlive)}</td><td class="mono">${esc(num(x.stillborn) + num(x.mummified))}</td></tr>`).join("") || `<tr><td colspan="4" class="muted">Sin registros.</td></tr>`}</tbody></table></div>
        </div></div>
        <div class="card"><div class="hd"><div><h2>Camadas</h2><p>Últimos 10</p></div></div><div class="bd">
          <div class="wrap"><table><thead><tr><th>Lote</th><th>Nac.</th><th>Dest.</th><th>Inicial</th><th>Actual</th></tr></thead>
          <tbody>${ba.map((b) => `<tr><td class="mono">${esc(b.id.slice(-8))}</td><td class="mono">${esc(b.birthDate || "—")}</td><td class="mono">${esc(b.weaningDate || "—")}</td><td class="mono">${esc(b.countInitial)}</td><td class="mono">${esc(b.countCurrent)}</td></tr>`).join("") || `<tr><td colspan="5" class="muted">Sin registros.</td></tr>`}</tbody></table></div>
        </div></div>
      </div>`,
            footer: `<button class="btn" id="mClose">Cerrar</button><button class="btn" id="goSvc">🧬 Servicio</button><button class="btn" id="supSow">➖ Suministrar</button><button class="btn" id="goFar">👶 Registrar parto</button>`,
            onMount: () => {
              $("#goSvc").onclick = () => {
                dlg.close();
                openBreeding(null, { sowId: id });
              };
              $("#goFar").onclick = () => {
                dlg.close();
                openBatch(null, {
                  mode: "birth",
                  sowId: id,
                  birthDate: today(),
                });
              };
              const ss = $("#supSow");
              if (ss)
                ss.onclick = () => {
                  dlg.close();
                  openSupplyFor("sow", id);
                };
              // Botón dentro del historial
              dlgBody.querySelectorAll("button[data-supply]").forEach((b) => {
                b.onclick = () => {
                  const t = b.dataset.supply;
                  const did = b.dataset.supplyid;
                  dlg.close();
                  openSupplyFor(t, did);
                };
              });
              // Ver camada desde ganancias
              dlgBody
                .querySelectorAll('button[data-act="viewBatch"]')
                .forEach((b) => {
                  b.onclick = () => {
                    const bid = b.dataset.id;
                    dlg.close();
                    openBatch(bid);
                  };
                });
            },
          });
        }

        function delSow(id) {
          const s = get.sow(id);
          if (!s) return;
          openModal({
            title: "Eliminar cerda",
            sub: "Puedes mantener historial o purgar todo.",
            body: `<div class="muted">Eliminar: <b>${esc(s.tag || s.name || "—")}</b></div>
      <div style="margin-top:10px">
        <label>Modo</label>
        <select id="delMode">
          <option value="keep">Mantener historial (recomendado)</option>
          <option value="purge">Borrar TODO asociado</option>
        </select>
      </div>`,
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn danger" id="okDel">Eliminar</button>`,
            onMount: () => {
              $("#okDel").onclick = () => {
                const mode = $("#delMode").value;
                state.sows = state.sows.filter((x) => x.id !== id);
                if (mode === "purge") {
                  const brIds = new Set(
                    state.breedings
                      .filter((b) => b.sowId === id)
                      .map((b) => b.id),
                  );
                  state.breedings = state.breedings.filter(
                    (b) => b.sowId !== id,
                  );
                  state.farrowings = state.farrowings.filter(
                    (f) => f.sowId !== id,
                  );
                  const batchIds = new Set(
                    state.batches
                      .filter((b) => b.sowId === id)
                      .map((b) => b.id),
                  );
                  state.batches = state.batches.filter((b) => b.sowId !== id);
                  state.sales = state.sales.filter(
                    (s) => !batchIds.has(s.batchId),
                  );
                  const saleIds = new Set(state.sales.map((s) => s.id));
                  state.payments = state.payments.filter((p) =>
                    saleIds.has(p.saleId),
                  );
                  state.tasks = state.tasks.filter(
                    (t) =>
                      !(t.relatedType === "breeding" && brIds.has(t.relatedId)),
                  );
                } else {
                  state.breedings.forEach((b) => {
                    if (b.sowId === id) b.sowId = "";
                  });
                  state.farrowings.forEach((f) => {
                    if (f.sowId === id) f.sowId = "";
                  });
                  state.batches.forEach((b) => {
                    if (b.sowId === id) b.sowId = "";
                  });
                }
                save();
                dlg.close();
                toast("ok", "Eliminado", "Cerda eliminada.");
                render();
              };
            },
          });
        }

        // ------- Reproducción -------
        function renderBreedings() {
          const closed = new Set(
            state.farrowings.map((f) => f.breedingId).filter(Boolean),
          );
          const rows = state.breedings
            .filter((b) => {
              const s = get.sow(b.sowId);
              return matchQ(
                b.date,
                b.method,
                b.expectedFarrowing,
                b.notes,
                s?.tag,
                s?.name,
              );
            })
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
            .map((b) => {
              const s = get.sow(b.sowId);
              const open = !closed.has(b.id);
              const inD = b.expectedFarrowing
                ? daysBetween(today(), b.expectedFarrowing)
                : null;
              const tag = open
                ? inD !== null && inD >= 0 && inD <= 14
                  ? `<span class="tag warn">Próximo</span>`
                  : `<span class="tag">Gestación</span>`
                : `<span class="tag ok">Cerrado</span>`;
              return `<tr>
          <td class="mono">${esc(b.date || "—")}</td>
          <td>${esc(s?.tag || s?.name || "—")}<div class="muted">${esc(s?.breed || "")}</div></td>
          <td>${esc(b.method || "—")}</td>
          <td class="mono">${esc(b.expectedFarrowing || "—")}<div class="muted">${open && inD !== null ? `${inD} días` : ""}</div></td>
          <td>${tag}</td>
          <td class="mono">${(() => {
            const inv = invested.batch(b.id);
            return inv ? fmtCOP(inv) : "—";
          })()}</td>
          <td>
            <button class="btn" data-act="edit" data-id="${b.id}">Editar</button>
            <button class="btn primary" data-act="far" data-id="${b.id}">Registrar parto</button>
            <button class="btn danger" data-act="del" data-id="${b.id}">Eliminar</button>
          </td>
        </tr>`;
            })
            .join("");

          view.innerHTML = shell(
            "Reproducción",
            `Servicios e inseminaciones. Gestación por defecto: ${state.settings.gestationDays} días.`,
            `<button class="btn primary" id="add">🧬 Registrar servicio</button>`,
            `<div class="wrap"><table>
        <thead><tr><th>Servicio</th><th>Cerda</th><th>Método</th><th>Parto est.</th><th>Estado</th><th>Inversión</th><th>Acciones</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="6" class="muted">Sin registros.</td></tr>`}</tbody>
      </table></div>`,
          );
          $("#add").onclick = () => openBreeding();

          view.onclick = (e) => {
            const b = e.target.closest("button[data-act]");
            if (!b) return;
            const id = b.dataset.id,
              act = b.dataset.act;
            if (act === "edit") openBreeding(id);
            if (act === "far") openFarrowing(null, { breedingId: id });
            if (act === "del") delBreeding(id);
          };
        }

        function breedingForm(b, preset = {}) {
          if (!state.sows.length)
            return `<div class="muted">Primero crea una cerda.</div>`;
          b = b || {
            sowId: preset.sowId || "",
            date: today(),
            method: "inseminación",
            expectedFarrowing: "",
            notes: "",
          };
          if (!b.expectedFarrowing && b.date)
            b.expectedFarrowing = addDays(
              b.date,
              num(state.settings.gestationDays) || 115,
            );
          const baseMethods = ["inseminación", "monta", "otro"];
          let methods = (state.settings?.serviceMethods || [])
            .slice()
            .map((x) => String(x ?? "").trim())
            .filter(Boolean);
          if (!methods.length) methods = baseMethods.slice();
          baseMethods.forEach((x) => {
            if (!methods.some((m) => m.toLowerCase() === x.toLowerCase()))
              methods.push(x);
          });
          if (
            b.method &&
            !methods.some(
              (m) => m.toLowerCase() === String(b.method).toLowerCase(),
            )
          )
            methods.push(String(b.method));

          const sowOps = state.sows
            .slice()
            .sort((a, b) => (a.tag || "").localeCompare(b.tag || ""))
            .map(
              (s) =>
                `<option value="${s.id}" ${b.sowId === s.id ? "selected" : ""}>${esc(s.tag || s.name || "—")}${s.name ? ` — ${esc(s.name)}` : ""}</option>`,
            )
            .join("");
          return `<form id="breedingForm" class="grid2">
      <div class="f6"><label>Cerda *</label><select name="sowId" required><option value="">Selecciona</option>${sowOps}</select></div>
      <div class="f3"><label>Fecha servicio *</label><input type="date" name="date" required value="${esc(b.date)}"/></div>
      <div class="f3">
        <label>Método</label>
        <select name="method" id="breedingMethod">
          ${methods.map((x) => `<option ${String(b.method || "").toLowerCase() === String(x).toLowerCase() ? "selected" : ""} value="${x}">${x}</option>`).join("")}
        </select>
        <div class="miniRow">
          <input type="text" id="breedingNewMethod" placeholder="Nuevo método…" />
          <button type="button" class="btn" id="breedingAddMethod">Agregar</button>
        </div>
        <div class="muted" style="margin-top:6px">Si es un método nuevo, escríbelo y presiona <b>Agregar</b>.</div>
      </div>
      <div class="f4"><label>Parto estimado</label><input type="date" name="expectedFarrowing" value="${esc(b.expectedFarrowing)}"/></div>
      <div class="f12"><label>Notas</label><textarea name="notes">${esc(b.notes)}</textarea></div>
    </form>
`;
        }

        function openBreeding(id, preset = {}) {
          if (!state.sows.length) {
            toast("warn", "Sin cerdas", "Primero crea una cerda.");
            openSow();
            return;
          }
          const b = id ? get.breeding(id) : null;
          openModal({
            title: id ? "Editar servicio" : "Registrar servicio",
            sub: "Crea una gestación y calcula fecha de parto estimada.",
            body: breedingForm(b, preset),
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="save">Guardar</button>`,
            onMount: () => {
              const f = $("#breedingForm");
              const date = f.querySelector('input[name="date"]');
              const due = f.querySelector('input[name="expectedFarrowing"]');
              date.onchange = () => {
                if (date.value)
                  due.value = addDays(
                    date.value,
                    num(state.settings.gestationDays) || 115,
                  );
              };
              // Permitir agregar nuevos métodos de servicio
              const sel = f.querySelector("#breedingMethod");
              const newI = f.querySelector("#breedingNewMethod");
              const addB = f.querySelector("#breedingAddMethod");
              const base = ["inseminación", "monta", "otro"];
              const refreshMethods = (selected) => {
                state.settings = state.settings || defaults().settings;
                let arr = (state.settings.serviceMethods || [])
                  .map((x) => String(x ?? "").trim())
                  .filter(Boolean);
                const uniq = [];
                [...arr, ...base].forEach((x) => {
                  const k = x.toLowerCase();
                  if (!uniq.some((u) => u.toLowerCase() === k)) uniq.push(x);
                });
                state.settings.serviceMethods = uniq;
                if (sel) {
                  sel.innerHTML = uniq
                    .map((x) => `<option value="${x}">${x}</option>`)
                    .join("");
                  if (selected) sel.value = selected;
                }
              };
              refreshMethods(sel?.value || "");
              if (addB && newI && sel) {
                addB.onclick = () => {
                  const v = (newI.value || "").trim();
                  if (!v) {
                    openAlert({
                      title: "Faltan datos",
                      message: "Escribe el nombre del nuevo método/servicio.",
                      kind: "bad",
                    });
                    return;
                  }
                  // agregar (sin duplicados)
                  state.settings.serviceMethods =
                    state.settings.serviceMethods || [];
                  if (
                    !state.settings.serviceMethods.some(
                      (x) => String(x).toLowerCase() === v.toLowerCase(),
                    )
                  ) {
                    state.settings.serviceMethods.push(v);
                  }
                  refreshMethods(v);
                  sel.value = v;
                  newI.value = "";
                  save();
                  toast("ok", "Agregado", `Método: ${v}`);
                };
                newI.addEventListener("keydown", (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addB.click();
                  }
                });
              }

              $("#save").onclick = () => saveBreeding(id);
            },
          });
        }

        function saveBreeding(id) {
          const f = $("#breedingForm");
          const fd = new FormData(f);
          const sowId = (fd.get("sowId") || "").toString();
          const date = (fd.get("date") || "").toString();
          if (!sowId || !date) {
            toast("bad", "Faltan datos", "Cerda y fecha son obligatorios.");
            return;
          }
          const payload = {
            id: id || uid("brd"),
            sowId,
            date,
            method: (fd.get("method") || "inseminación").toString(),
            expectedFarrowing:
              (fd.get("expectedFarrowing") || "").toString() ||
              addDays(date, num(state.settings.gestationDays) || 115),
            notes: (fd.get("notes") || "").toString().trim(),
          };
          if (id)
            state.breedings = state.breedings.map((x) =>
              x.id === id ? payload : x,
            );
          else {
            state.breedings.push(payload);
            // task sugerida chequeo preñez
            state.tasks.push({
              id: uid("tsk"),
              title: `Chequeo preñez — ${get.sow(sowId)?.tag || "cerda"}`,
              dueDate: addDays(date, 25),
              priority: "media",
              status: "pendiente",
              relatedType: "breeding",
              relatedId: payload.id,
              notes: "Sugerido 21–28 días.",
            });
          }
          save();
          dlg.close();
          toast("ok", "Guardado", "Servicio guardado.");
          render();
        }

        function delBreeding(id) {
          const b = get.breeding(id);
          if (!b) return;
          const has = state.farrowings.some((f) => f.breedingId === id);
          if (has) {
            toast("bad", "No permitido", "Este servicio ya tiene parto.");
            return;
          }
          state.breedings = state.breedings.filter((x) => x.id !== id);
          state.tasks = state.tasks.filter(
            (t) => !(t.relatedType === "breeding" && t.relatedId === id),
          );
          save();
          toast("ok", "Eliminado", "Servicio eliminado.");
          render();
        }

        // ------- Partos y Camadas -------
        function renderLitters() {
          const rows = state.batches
            .filter((b) => {
              const s = get.sow(b.sowId);
              return matchQ(
                b.id,
                b.birthDate,
                b.weaningDate,
                b.status,
                b.notes,
                s?.tag,
                s?.name,
              );
            })
            .sort((a, b) =>
              (b.birthDate || "").localeCompare(a.birthDate || ""),
            )
            .map((b) => {
              const s = get.sow(b.sowId);
              const tag =
                (b.status || "disponible") === "cerrado"
                  ? `<span class="tag ok">Cerrado</span>`
                  : `<span class="tag">Disponible</span>`;
              return `<tr>
          <td class="mono">${esc(b.id.slice(-8))}</td>
          <td>${esc(s?.tag || s?.name || "—")}</td>
          <td class="mono">${esc(b.birthDate || "—")}</td>
          <td class="mono">${esc(b.weaningDate || "—")}</td>
          <td class="mono">${esc(b.countInitial)}</td>
          <td class="mono">${esc(b.countCurrent)}</td>
          <td>${tag}</td>
          <td class="mono">${(() => {
            const inv = invested.batch(b.id);
            return inv ? fmtCOP(inv) : "—";
          })()}</td>
          <td>
            <button class="btn" data-act="edit" data-id="${b.id}">Editar</button>
            <button class="btn" data-act="mort" data-id="${b.id}">Mortalidad</button>
            <button class="btn" data-act="supply" data-id="${b.id}">Suministrar producto</button>
            <button class="btn primary" data-act="sell" data-id="${b.id}">Vender</button>
          </td>
        </tr>`;
            })
            .join("");

          view.innerHTML = shell(
            "Camadas",
            "Cada parto crea un lote. Controla cantidad actual y disponibilidad.",
            `<button class="btn" id="far">👶 Registrar parto</button><button class="btn" id="manual">➕ Camada manual</button>`,
            `<div class="wrap"><table>
        <thead><tr><th>Lote</th><th>Cerda</th><th>Nac.</th><th>Dest.</th><th>Inicial</th><th>Actual</th><th>Estado</th><th>Inversión</th><th>Acciones</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="9" class="muted">Sin camadas.</td></tr>`}</tbody>
      </table></div>`,
          );

          $("#far").onclick = () => openBatch(null, { mode: "birth" });
          $("#manual").onclick = () => openBatch();

          view.onclick = (e) => {
            const b = e.target.closest("button[data-act]");
            if (!b) return;
            const id = b.dataset.id,
              act = b.dataset.act;
            if (act === "edit") openBatch(id);
            if (act === "mort") adjustBatch(id);
            if (act === "supply") {
              const bb = get.batch(id);
              if ((bb?.status || "").toLowerCase() === "cerrado") {
                openAlert({
                  title: "No permitido",
                  message: "Esta camada ya fue vendida.",
                  kind: "bad",
                });
                return;
              }
              openSupplyFor("batch", id);
            }
            if (act === "sell") openSale(null, { batchId: id });
          };
        }

        function farrowingForm(f, preset = {}) {
          if (!state.sows.length)
            return `<div class="muted">Primero crea una cerda.</div>`;
          const closed = new Set(
            state.farrowings.map((x) => x.breedingId).filter(Boolean),
          );
          const openBr = state.breedings.filter((b) => !closed.has(b.id));
          f = f || {
            breedingId: preset.breedingId || "",
            sowId: preset.sowId || "",
            date: today(),
            bornTotal: 0,
            bornAlive: 0,
            stillborn: 0,
            mummified: 0,
            notes: "",
          };
          const sowOps = state.sows
            .slice()
            .sort((a, b) => (a.tag || "").localeCompare(b.tag || ""))
            .map(
              (s) =>
                `<option value="${s.id}" ${f.sowId === s.id ? "selected" : ""}>${esc(s.tag || s.name || "—")}</option>`,
            )
            .join("");
          const brOps = openBr
            .slice()
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
            .map((b) => {
              const s = get.sow(b.sowId);
              return `<option value="${b.id}" ${f.breedingId === b.id ? "selected" : ""}>${esc(b.date)} • ${esc(s?.tag || "cerda")} • est ${esc(b.expectedFarrowing || "—")}</option>`;
            })
            .join("");
          return `<form id="farForm" class="grid2">
      <div class="f12"><label>Servicio asociado (opcional)</label><select name="breedingId" id="ffBr"><option value="">(Sin servicio)</option>${brOps}</select></div>
      <div class="f6"><label>Cerda *</label><select name="sowId" id="ffSow" required><option value="">Selecciona</option>${sowOps}</select></div>
      <div class="f6"><label>Fecha parto *</label><input type="date" name="date" value="${esc(f.date)}" required/></div>
      <div class="f3"><label>Total</label><input type="number" name="bornTotal" value="${esc(f.bornTotal)}" min="0"/></div>
      <div class="f3"><label>Vivos</label><input type="number" name="bornAlive" value="${esc(f.bornAlive)}" min="0"/></div>
      <div class="f3"><label>Muertos</label><input type="number" name="stillborn" value="${esc(f.stillborn)}" min="0"/></div>
      <div class="f3"><label>Momificados</label><input type="number" name="mummified" value="${esc(f.mummified)}" min="0"/></div>
      <div class="f12"><label>Notas</label><textarea name="notes">${esc(f.notes)}</textarea></div>
      <div class="f12"><span class="tag">Al guardar se crea una camada con nacidos vivos.</span></div>
    </form>
`;
        }

        function openFarrowing(id, preset = {}) {
          if (!state.sows.length) {
            toast("warn", "Sin cerdas", "Primero crea una cerda.");
            openSow();
            return;
          }
          const f = id ? state.farrowings.find((x) => x.id === id) : null;
          openModal({
            title: id ? "Editar parto" : "Registrar parto",
            sub: "Se crea o actualiza el lote/camada automáticamente.",
            body: farrowingForm(f, preset),
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="save">Guardar</button>`,
            onMount: () => {
              const sel = $("#ffBr"),
                sow = $("#ffSow");
              sel.onchange = () => {
                const br = get.breeding(sel.value);
                if (br && br.sowId) sow.value = br.sowId;
              };
              $("#save").onclick = () => saveFarrowing(id);
            },
          });
        }

        function saveFarrowing(id) {
          const f = $("#farForm");
          const fd = new FormData(f);
          const sowId = (fd.get("sowId") || "").toString();
          const date = (fd.get("date") || "").toString();
          if (!sowId || !date) {
            toast("bad", "Faltan datos", "Cerda y fecha son obligatorios.");
            return;
          }
          const breedingId = (fd.get("breedingId") || "").toString();
          if (breedingId) {
            const dup = state.farrowings.find(
              (x) => x.breedingId === breedingId && x.id !== id,
            );
            if (dup) {
              toast("bad", "Duplicado", "Ese servicio ya tiene parto.");
              return;
            }
          }
          const payload = {
            id: id || uid("far"),
            breedingId: breedingId || "",
            sowId,
            date,
            bornTotal: num(fd.get("bornTotal")),
            bornAlive: num(fd.get("bornAlive")),
            stillborn: num(fd.get("stillborn")),
            mummified: num(fd.get("mummified")),
            notes: (fd.get("notes") || "").toString().trim(),
          };
          if (id)
            state.farrowings = state.farrowings.map((x) =>
              x.id === id ? payload : x,
            );
          else {
            state.farrowings.push(payload);
            state.tasks.push({
              id: uid("tsk"),
              title: `Destete sugerido — ${get.sow(sowId)?.tag || "cerda"}`,
              dueDate: addDays(date, 25),
              priority: "media",
              status: "pendiente",
              relatedType: "batch",
              relatedId: "",
              notes: "Ajusta 21–35 días según manejo.",
            });
            state.tasks.push({
              id: uid("tsk"),
              title: `Engorde (48 días) — ${get.sow(sowId)?.tag || "cerda"}`,
              dueDate: addDays(date, 48),
              priority: "media",
              status: "pendiente",
              relatedType: "batch",
              relatedId: "",
              notes: "Al día 48, los no vendidos pasan a engorde (Carne).",
            });
          }

          // batch linked
          let batch = state.batches.find((b) => b.farrowingId === payload.id);
          const init = Math.max(0, payload.bornAlive);
          if (!batch) {
            batch = {
              id: uid("bat"),
              sowId,
              farrowingId: payload.id,
              birthDate: date,
              weaningDate: addDays(date, 25),
              countInitial: init,
              countCurrent: init,
              status: "disponible",
              notes: "",
            };
            state.batches.push(batch);
          } else {
            batch.sowId = sowId;
            batch.birthDate = date;
            batch.weaningDate = batch.weaningDate || addDays(date, 25);
            batch.engordeDate = batch.engordeDate || addDays(date, 48);
            batch.countInitial = init;
            batch.countCurrent = Math.min(num(batch.countCurrent), init);
          }
          // link destete task
          const t = state.tasks.find(
            (x) =>
              x.relatedType === "batch" &&
              x.relatedId === "" &&
              x.title.startsWith("Destete sugerido"),
          );
          if (t) t.relatedId = batch.id;
          const t2 = state.tasks.find(
            (x) =>
              x.relatedType === "batch" &&
              x.relatedId === "" &&
              x.title.startsWith("Engorde (48 días)"),
          );
          if (t2) t2.relatedId = batch.id;

          save();
          dlg.close();
          toast("ok", "Guardado", "Parto registrado.");
          render();
        }

        function batchForm(b) {
          if (!state.sows.length)
            return `<div class="muted">Primero crea una cerda.</div>`;
          b = b || {
            sowId: "",
            birthDate: today(),
            weaningDate: addDays(today(), 25),
            countInitial: 0,
            countCurrent: 0,
            status: "disponible",
            notes: "",
          };
          const sowOps = state.sows
            .slice()
            .sort((a, b) => (a.tag || "").localeCompare(b.tag || ""))
            .map(
              (s) =>
                `<option value="${s.id}" ${b.sowId === s.id ? "selected" : ""}>${esc(s.tag || s.name || "—")}</option>`,
            )
            .join("");
          return `<form id="batchForm" class="grid2">
      <div class="f6"><label>Cerda *</label><select name="sowId" required><option value="">Selecciona</option>${sowOps}</select></div>
      <div class="f6"><label>Estado</label><select name="status">${["disponible", "reservado", "vendido", "engorde", "cerrado"].map((x) => `<option ${b.status === x ? "selected" : ""} value="${x}">${x}</option>`).join("")}</select></div>
      <div class="f4"><label>Nacimiento *</label><input type="date" name="birthDate" required value="${esc(b.birthDate)}"/></div>
      <div class="f4"><label>Destete</label><input type="date" name="weaningDate" value="${esc(b.weaningDate)}"/></div>
      <div class="f4"><label>Cantidad inicial</label><input type="number" name="countInitial" value="${esc(b.countInitial)}" min="0"/></div>
      <div class="f4"><label>Cantidad actual</label><input type="number" name="countCurrent" value="${esc(b.countCurrent)}" min="0" placeholder="(vacío = inicial)"/></div>
      <div class="f12"><label>Notas</label><textarea name="notes">${esc(b.notes)}</textarea></div>
    </form>
`;
        }

        function openBatch(id, pre = {}) {
          if (!state.sows.length) {
            toast("warn", "Sin cerdas", "Primero crea una cerda.");
            openSow();
            return;
          }
          const b0 = id ? get.batch(id) : null;
          const mode = pre && pre.mode ? pre.mode : "manual";
          const b =
            b0 ||
            (pre && !id
              ? Object.assign(
                  {
                    id: uid("bat"),
                    sowId: "",
                    birthDate: today(),
                    weaningDate: "",
                    countInitial: "",
                    countCurrent: "",
                    status: "disponible",
                    notes: "",
                  },
                  pre,
                )
              : null);

          openModal({
            title: id
              ? "Editar camada"
              : mode === "birth"
                ? "Registrar parto"
                : "Camada manual",
            sub: id
              ? ""
              : mode === "birth"
                ? "Registra un parto creando la camada (mismo formulario de camada manual)."
                : "Útil si registras lotes sin usar el módulo de parto.",
            body:
              batchForm(b) +
              (id
                ? profitHistoryHTML("batch", id) +
                  supplyHistoryHTML("batch", id)
                : ""),
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="save">Guardar</button>`,
            onMount: () => {
              const f = $("#batchForm");
              const birth = f.querySelector('input[name="birthDate"]');
              const wean = f.querySelector('input[name="weaningDate"]');
              birth.onchange = () => {
                if (birth.value && !wean.value)
                  wean.value = addDays(birth.value, 25);
              };
              // Botón dentro del historial de suministros
              dlgBody.querySelectorAll("button[data-supply]").forEach((b) => {
                b.onclick = () => {
                  const t = b.dataset.supply;
                  const did = b.dataset.supplyid;
                  dlg.close();
                  openSupplyFor(t, did);
                };
              });
              $("#save").onclick = () => {
                const fd = new FormData(f);
                const sowId = (fd.get("sowId") || "").toString();
                const birthDate = (fd.get("birthDate") || "").toString();
                if (!sowId || !birthDate) {
                  toast(
                    "bad",
                    "Faltan datos",
                    "Cerda y nacimiento son obligatorios.",
                  );
                  return;
                }
                const ci = num(fd.get("countInitial"));
                const ccRaw = (fd.get("countCurrent") || "").toString().trim();
                const cc = ccRaw === "" ? ci : num(ccRaw);

                const payload = {
                  id: id || uid("bat"),
                  sowId,
                  farrowingId: b?.farrowingId || "",
                  birthDate,
                  weaningDate: (fd.get("weaningDate") || "").toString(),
                  countInitial: ci,
                  countBornAlive: ci,
                  countCurrent: Math.min(cc, ci),
                  status: (fd.get("status") || "disponible").toString(),
                  notes: (fd.get("notes") || "").toString().trim(),
                };
                if (id)
                  state.batches = state.batches.map((x) =>
                    x.id === id ? payload : x,
                  );
                else {
                  state.batches.push(payload);
                  // Crear tareas sugeridas (destete y engorde) para camadas manuales
                  const existsWean = state.tasks.some(
                    (t) =>
                      t.relatedType === "batch" &&
                      t.relatedId === payload.id &&
                      t.title.startsWith("Destete sugerido"),
                  );
                  if (!existsWean)
                    state.tasks.push({
                      id: uid("tsk"),
                      title: `Destete sugerido — ${get.sow(payload.sowId)?.tag || "cerda"}`,
                      dueDate: addDays(payload.birthDate, 25),
                      priority: "media",
                      status: "pendiente",
                      relatedType: "batch",
                      relatedId: payload.id,
                      notes:
                        "Destete sugerido a los 25 días (ajusta según manejo).",
                    });
                  const existsFat = state.tasks.some(
                    (t) =>
                      t.relatedType === "batch" &&
                      t.relatedId === payload.id &&
                      t.title.startsWith("Engorde (48 días)"),
                  );
                  if (!existsFat)
                    state.tasks.push({
                      id: uid("tsk"),
                      title: `Engorde (48 días) — ${get.sow(payload.sowId)?.tag || "cerda"}`,
                      dueDate: addDays(payload.birthDate, 48),
                      priority: "media",
                      status: "pendiente",
                      relatedType: "batch",
                      relatedId: payload.id,
                      notes:
                        "Al día 48, los no vendidos pasan a engorde (Carne).",
                    });
                }
                save();
                dlg.close();
                toast("ok", "Guardado", "Camada guardada.");
                render();
              };
            },
          });
        }

        function adjustBatch(id) {
          const b = get.batch(id);
          if (!b) return;
          openModal({
            title: "Ajuste de camada",
            sub: `Lote ${b.id.slice(-8)} • Actual ${b.countCurrent}`,
            body: `<form id="adjForm" class="grid2">
        <div class="f4"><label>Fecha</label><input type="date" name="date" value="${today()}"/></div>
        <div class="f4"><label>Tipo</label><select name="type"><option value="mortalidad">Mortalidad (resta)</option><option value="ajuste">Ajuste (definir)</option></select></div>
        <div class="f4"><label>Cantidad</label><input type="number" name="qty" value="1" min="0"/></div>
        <div class="f12"><label>Notas</label><textarea name="notes"></textarea></div>
      </form>`,
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="ok">Aplicar</button>`,
            onMount: () => {
              $("#ok").onclick = () => {
                const fd = new FormData($("#adjForm"));
                const type = (fd.get("type") || "mortalidad").toString();
                const qty = num(fd.get("qty"));
                if (qty <= 0) {
                  toast("bad", "Cantidad inválida", "Debe ser > 0.");
                  return;
                }
                const before = num(b.countCurrent);
                let after = before;
                if (type === "mortalidad") after = Math.max(0, before - qty);
                else after = Math.max(0, qty);
                b.countCurrent = after;
                if (after === 0) b.status = "cerrado";
                state.stockMovements.push({
                  id: uid("mov"),
                  itemId: "",
                  type: "ajuste",
                  date: (fd.get("date") || today()).toString(),
                  qty: type === "mortalidad" ? -qty : after - before,
                  unitCost: 0,
                  linkedType: "batch",
                  linkedId: b.id,
                  notes:
                    `Camada ${type}. ${(fd.get("notes") || "").toString().trim()}`.trim(),
                });
                save();
                dlg.close();
                toast("ok", "Aplicado", `${before} → ${after}`);
                render();
              };
            },
          });
        }

        // ------- Inventario -------
        function renderInventory() {
          const rows = state.inventory
            .filter((i) =>
              matchQ(i.name, i.category, i.supplier, i.notes, i.unit),
            )
            .sort(
              (a, b) =>
                (a.category || "").localeCompare(b.category || "") ||
                (a.name || "").localeCompare(b.name || ""),
            )
            .map((i) => {
              const low = num(i.qty) <= num(i.minQty || 0);
              return `<tr>
          <td><b>${esc(i.name)}</b><div class="muted">${esc(i.category || "")}</div></td>
          <td class="mono">${esc(i.qty)} ${esc(i.unit || "")}</td>
          <td class="mono">${esc(i.minQty || 0)} ${esc(i.unit || "")}</td>
          <td>${low ? `<span class="tag bad">Bajo</span>` : `<span class="tag ok">OK</span>`}</td>
          <td class="mono">${esc(fmtCOP(i.unitCost || 0))}</td>
          <td>${esc(i.supplier || "—")}<div class="muted">Vence: ${esc(i.expiration || "—")}</div></td>
          <td>
            <button class="btn" data-act="in" data-id="${i.id}">Entrada</button>
            <button class="btn" data-act="out" data-id="${i.id}">Salida</button>
            <button class="btn" data-act="edit" data-id="${i.id}">Editar</button>
            <button class="btn danger" data-act="del" data-id="${i.id}">Eliminar</button>
          </td>
        </tr>`;
            })
            .join("");

          const low = lowStock();
          const lowMsg = low.length
            ? `<span class="tag bad">Bajo stock</span> <span class="muted">${low.map((x) => `${esc(x.name)} (${esc(x.qty)} ${esc(x.unit)})`).join(" • ")}</span>`
            : `<span class="muted">No hay stock crítico.</span>`;

          view.innerHTML = shell(
            "Inventario",
            "Alimentos, medicamentos e insumos con movimientos y alertas por mínimo.",
            `<button class="btn primary" id="add">➕ Nuevo insumo</button><button class="btn" id="movs">Ver movimientos</button>`,
            `<div class="row" style="margin-bottom:10px">${lowMsg}</div>
       <div class="wrap"><table>
        <thead><tr><th>Insumo</th><th>Cant.</th><th>Mín.</th><th>Estado</th><th>Costo unit.</th><th>Proveedor</th><th>Acciones</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="7" class="muted">Sin inventario.</td></tr>`}</tbody>
      </table></div>`,
          );

          $("#add").onclick = () => openInvItem();
          $("#movs").onclick = () => openMovs();
          view.onclick = (e) => {
            const b = e.target.closest("button[data-act]");
            if (!b) return;
            const id = b.dataset.id,
              act = b.dataset.act;
            if (act === "edit") openInvItem(id);
            if (act === "del") delInv(id);
            if (act === "in") openInvMove(id, "entrada");
            if (act === "out") openInvMove(id, "salida");
          };
        }

        function invForm(i, isNew) {
          isNew = !!isNew;
          i = i || {
            name: "",
            category: "alimento",
            unit: "kg",
            qty: 0,
            minQty: 0,
            unitCost: 0,
            supplier: "",
            expiration: "",
            notes: "",
          };
          return `<form id="invForm" class="grid2">
      <div class="f6"><label>Nombre *</label><input name="name" required value="${esc(i.name)}"/></div>
      <div class="f3"><label>Categoría</label><select name="category">
        ${["alimento", "medicamento", "insumo"].map((x) => `<option ${i.category === x ? "selected" : ""} value="${x}">${x}</option>`).join("")}
      </select></div>
      <div class="f3"><label>Unidad</label><input name="unit" value="${esc(i.unit)}" placeholder="kg, ml, und"/></div>

      <div class="f3"><label>Cantidad</label><input id="invQty" type="number" step="0.01" name="qty" value="${esc(i.qty)}" placeholder="0"/></div>
      <div class="f3"><label>bajo stock en</label><input type="number" step="0.01" name="minQty" value="${esc(i.minQty)}"/></div>

      <div class="f3"><label>Costo unitario</label>
        <input id="invUnitCost" type="number" step="0.01" name="unitCost" value="${esc(i.unitCost)}" placeholder="0"/>
        <div class="muted" style="margin-top:6px;font-size:12px">Si ingresas <b>Total compra</b>, se calcula automático.</div>
      </div>

      <div class="f12" style="margin-top:2px">
        <div class="tag info" style="display:inline-flex;gap:8px;align-items:center">
          <span style="font-weight:900">Compra</span><span class="muted">Opcional (recomendado si este insumo llega con factura)</span>
        </div>
      </div>

      <div class="f6">
        <label style="display:flex;gap:10px;align-items:center;cursor:pointer">
          <input id="invRegPurchase" type="checkbox" ${isNew ? "checked" : ""} style="width:18px;height:18px"/>
          Registrar compra/entrada inicial y enviarla a Finanzas
        </label>
      </div>
      <div class="f6"><label>Fecha compra</label><input type="date" name="pDate" value="${today()}"/></div>

      <div class="f4"><label>Total compra (COP)</label><input id="invTotal" type="number" step="0.01" name="totalCost" value="0" placeholder="0"/></div>
      <div class="f4"><label>Estado de pago</label>
        <select id="invPayStatus" name="payStatus">
          <option value="pagado">Pagado completo</option>
          <option value="credito">Crédito (pendiente)</option>
          <option value="parcial">Parcial (abonos)</option>
        </select>
      </div>
      <div class="f4"><label>Pagado hoy (COP)</label><input id="invPaidNow" type="number" step="0.01" name="paidNow" value="0" placeholder="0"/></div>

      <div class="f4"><label>Método</label>
        <select id="invMethod" name="method">
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="otro">Otro</option>
        </select>
      </div>
      <div class="f4"><label>Vence (si hay crédito)</label><input id="invDue" type="date" name="dueDate" value=""/></div>
      <div class="f4"><label>Proveedor</label><input name="supplier" value="${esc(i.supplier)}"/></div>

      <div class="f3"><label>Vencimiento (insumo/medicamento)</label><input type="date" name="expiration" value="${esc(i.expiration)}"/></div>
      <div class="f12"><label>Notas</label><textarea name="notes">${esc(i.notes)}</textarea></div>
    </form>
`;
        }

        function openInvItem(id) {
          const i = id ? get.inv(id) : null;
          openModal({
            title: id ? "Editar insumo" : "Nuevo insumo",
            sub: "Define mínimo para alertas.",
            body: invForm(i, !id),
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="save">Guardar</button>`,
            onMount: () => {
              const f = $("#invForm");
              const reg = $("#invRegPurchase");
              const qtyI = $("#invQty");
              const totalI = $("#invTotal");
              const ucI = $("#invUnitCost");
              const stI = $("#invPayStatus");
              const paidI = $("#invPaidNow");
              const dueI = $("#invDue");
              const methodI = $("#invMethod");

              function clampPaid() {
                const total = num(totalI?.value);
                if (stI?.value === "pagado") {
                  setMoney(paidI, Math.max(0, total));
                  paidI.disabled = true;
                  dueI.value = "";
                  dueI.disabled = true;
                } else if (stI?.value === "credito") {
                  setMoney(paidI, 0);
                  paidI.disabled = true;
                  dueI.disabled = false;
                } else {
                  paidI.disabled = false;
                  dueI.disabled = false;
                  const p = num(paidI.value);
                  if (p > total) setMoney(paidI, Math.max(0, total));
                }
              }

              function recalcUnit() {
                if (!reg || !reg.checked) return;
                const q = num(qtyI?.value);
                const total = num(totalI?.value);
                if (q > 0 && total > 0) {
                  const uc = total / q;
                  setMoney(ucI, Math.round(uc));
                }
                clampPaid();
              }
              if (reg) {
                reg.onchange = () => {
                  clampPaid();
                };
              }
              if (totalI) {
                totalI.oninput = recalcUnit;
              }
              if (qtyI) {
                qtyI.oninput = recalcUnit;
              }
              if (stI) {
                stI.onchange = clampPaid;
              }
              if (paidI) {
                paidI.oninput = clampPaid;
              }
              clampPaid();

              $("#save").onclick = () => {
                const fd = new FormData($("#invForm"));
                const name = (fd.get("name") || "").toString().trim();
                if (!name) {
                  toast("bad", "Falta nombre", "Obligatorio.");
                  return;
                }
                const payload = {
                  id: id || uid("inv"),
                  name,
                  category: (fd.get("category") || "alimento").toString(),
                  unit: (fd.get("unit") || "und").toString().trim() || "und",
                  qty: num(fd.get("qty")),
                  minQty: num(fd.get("minQty")),
                  unitCost: num($("#invUnitCost")?.value),
                  supplier: (fd.get("supplier") || "").toString().trim(),
                  expiration: (fd.get("expiration") || "").toString(),
                  notes: (fd.get("notes") || "").toString().trim(),
                };
                if (id)
                  state.inventory = state.inventory.map((x) =>
                    x.id === id ? payload : x,
                  );
                else state.inventory.push(payload);

                // Compra inicial opcional → movimiento + finanzas + cuentas por pagar
                if (!id) {
                  const reg = $("#invRegPurchase");
                  const q = num($("#invQty")?.value);
                  const total = num($("#invTotal")?.value);
                  if (reg?.checked && total <= 0) {
                    openAlert({
                      title: "Falta el total",
                      message:
                        "Si vas a registrar la compra en Finanzas, ingresa el Total compra (COP).",
                      kind: "bad",
                    });
                    return;
                  }
                  const date = (fd.get("pDate") || today()).toString();
                  const status = (
                    $("#invPayStatus")?.value || "pagado"
                  ).toString();
                  const method = (
                    $("#invMethod")?.value || "efectivo"
                  ).toString();
                  const due = ($("#invDue")?.value || "").toString();
                  let paidNow = num($("#invPaidNow")?.value);

                  if (reg?.checked && q > 0) {
                    // Movimiento de entrada inicial (historial)
                    state.stockMovements.push({
                      id: uid("mov"),
                      itemId: payload.id,
                      type: "entrada",
                      date,
                      qty: q,
                      unitCost: payload.unitCost || 0,
                      linkedType: "",
                      linkedId: "",
                      totalCost: total,
                      payStatus: status,
                      paidNow: Math.max(0, Math.min(total, paidNow)),
                      method,
                      supplier: payload.supplier || "",
                      dueDate: due,
                      notes: (
                        "Compra inicial" +
                        (payload.notes ? " • " + payload.notes : "")
                      ).trim(),
                    });
                  }

                  if (reg?.checked && total > 0) {
                    // Ajusta pagado según estado
                    if (status === "pagado") paidNow = total;
                    if (status === "credito") paidNow = 0;
                    paidNow = Math.max(0, Math.min(total, paidNow));

                    // Gasto en finanzas SOLO por lo pagado hoy (caja)
                    if (paidNow > 0) {
                      state.transactions.push({
                        id: uid("tx"),
                        date,
                        type: "gasto",
                        category: "Inventario / compra",
                        amount: paidNow,
                        method,
                        refType: "inventory",
                        refId: payload.id,
                        notes: `Compra: ${payload.name}`,
                      });
                    }

                    // Si queda pendiente, crear cuenta por pagar
                    const remain = Math.max(0, total - paidNow);
                    if (remain > 0) {
                      state.payables.push({
                        id: uid("pay"),
                        date,
                        category: "Inventario / compra",
                        supplier: payload.supplier || "",
                        refType: "inventory",
                        refId: payload.id,
                        itemName: payload.name,
                        total,
                        paid: paidNow,
                        dueDate: due,
                        method,
                        status: "abierto",
                        notes: `Compra: ${payload.name}`,
                      });
                    }
                  }
                }

                save();
                dlg.close();
                toast("ok", "Guardado", "Insumo guardado.");
                render();
              };
            },
          });
        }

        function delInv(id) {
          const i = get.inv(id);
          if (!i) return;
          openModal({
            title: "Eliminar insumo",
            sub: "Se mantendrán movimientos históricos (sin el nombre del item).",
            body: `<div class="muted">Eliminar: <b>${esc(i.name)}</b></div>`,
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn danger" id="ok">Eliminar</button>`,
            onMount: () => {
              $("#ok").onclick = () => {
                state.inventory = state.inventory.filter((x) => x.id !== id);
                state.stockMovements.forEach((m) => {
                  if (m.itemId === id) m.itemId = "";
                });
                save();
                dlg.close();
                toast("ok", "Eliminado", "Insumo eliminado.");
                render();
              };
            },
          });
        }

        function openInvMovePicker(mode) {
          if (!state.inventory.length) {
            toast("warn", "Sin inventario", "Primero crea un insumo.");
            openInvItem();
            return;
          }
          const ops = state.inventory
            .slice()
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
            .map(
              (i) =>
                `<option value="${i.id}">${esc(i.name)} • ${esc(i.category || "insumo")} • ${esc(i.qty || 0)} ${esc(i.unit || "")}</option>`,
            )
            .join("");
          openModal({
            title:
              mode === "entrada" ? "➕ Entrada rápida" : "➖ Salida rápida",
            sub:
              mode === "entrada"
                ? "Aumenta stock por compra/recepción."
                : "Descuenta stock por consumo. Si la relacionas con una cerda/camada, se suma a su inversión.",
            body: `<form id="pickMove" class="grid2">
        <div class="f12"><label>Insumo</label><select id="pickItem" name="itemId">${ops}</select></div>
      </form>
      ${
        mode === "salida"
          ? `
        <div class="emptyBig">
          <b>Tip</b>
          <div class="muted">En la salida puedes elegir “Relacionado con: Cerda / Camada” para que el sistema acumule la <b>inversión</b> en esa cerda o camada.</div>
        </div>`
          : ""
      }`,
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="go">Continuar</button>`,
            onMount: () => {
              $("#go").onclick = () => {
                const id = $("#pickItem").value;
                dlg.close();
                openInvMove(id, mode);
              };
            },
          });
        }

        function openSupplyFor(type, linkedId) {
          if (!state.inventory.length) {
            toast("warn", "Sin inventario", "Primero crea un insumo.");
            openInvItem();
            return;
          }
          const title =
            type === "sow" ? "Suministrar a cerda" : "Suministrar a camada";
          const ops = state.inventory
            .slice()
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
            .map(
              (i) =>
                `<option value="${i.id}">${esc(i.name)} • ${esc(i.category || "insumo")} • ${esc(i.qty || 0)} ${esc(i.unit || "")}</option>`,
            )
            .join("");
          openModal({
            title,
            sub: "Selecciona el insumo a suministrar (se registrará como salida y sumará a la inversión).",
            body: `<form id="supPick" class="grid2">
        <div class="f12"><label>Insumo</label><select id="supItem" name="itemId">${ops}</select></div>
      </form>`,
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="go">Continuar</button>`,
            onMount: () => {
              $("#go").onclick = () => {
                const itemId = $("#supItem").value;
                dlg.close();
                openInvMove(itemId, "salida", { type, id: linkedId });
              };
            },
          });
        }

        function openSupplySowPicker() {
          if (!state.sows.length) {
            toast("warn", "Sin cerdas", "Primero registra una cerda.");
            openSow();
            return;
          }
          const ops = state.sows
            .slice()
            .sort((a, b) => (a.tag || "").localeCompare(b.tag || ""))
            .map(
              (s) =>
                `<option value="${s.id}">${esc(s.tag || "—")} • ${esc(s.breed || "")}</option>`,
            )
            .join("");
          openModal({
            title: "Suministrar producto",
            sub: "Selecciona la cerda y luego el insumo (se registrará como salida y sumará a la inversión).",
            body: `<form id="supSowPick" class="grid2">
        <div class="f12"><label>Cerda</label><select id="supSowId">${ops}</select></div>
      </form>`,
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="go">Continuar</button>`,
            onMount: () => {
              $("#go").onclick = () => {
                const sowId = $("#supSowId").value;
                dlg.close();
                openSupplyFor("sow", sowId);
              };
            },
          });
        }

        function openSupplyBatchPicker() {
          const openB = state.batches.filter(
            (b) => (b.status || "").toLowerCase() !== "cerrado",
          );
          if (!openB.length) {
            openAlert({
              title: "No permitido",
              message: "No hay camadas abiertas para alimentar.",
              kind: "warn",
            });
            return;
          }
          const ops = openB
            .slice()
            .sort((a, b) =>
              (b.birthDate || "").localeCompare(a.birthDate || ""),
            )
            .map((b) => {
              const s = get.sow(b.sowId);
              const lote = b.lot || b.tag || "Lote " + (b.birthDate || "");
              const sow = s?.tag || s?.name || "—";
              return `<option value="${b.id}">${esc(lote)} • ${esc(sow)} • ${esc(b.countCurrent || 0)} lechones • ${esc(b.status || "")}</option>`;
            })
            .join("");
          openModal({
            title: "Alimentar camadas",
            sub: "Selecciona la camada y luego el insumo (se registrará como salida y sumará a la inversión).",
            body: `<form id="supBatchPick" class="grid2">
        <div class="f12"><label>Camada</label><select id="supBatchId">${ops}</select></div>
      </form>`,
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="go">Continuar</button>`,
            onMount: () => {
              $("#go").onclick = () => {
                const batchId = $("#supBatchId").value;
                const bb = get.batch(batchId);
                if ((bb?.status || "").toLowerCase() === "cerrado") {
                  dlg.close();
                  openAlert({
                    title: "No permitido",
                    message: "Esta camada ya fue vendida.",
                    kind: "bad",
                  });
                  return;
                }
                dlg.close();
                openSupplyFor("batch", batchId);
              };
            },
          });
        }

        function openInvMove(itemId, mode, forcedLink) {
          const i = get.inv(itemId);
          if (!i) return;
          openModal({
            title:
              mode === "entrada"
                ? "Entrada a inventario"
                : "Salida de inventario",
            sub: `${i.name} • ${i.category}`,
            body: `<form id="movForm" class="grid2">
        <div class="f4"><label>Fecha</label><input type="date" name="date" value="${today()}"/></div>
        <div class="f4"><label>Cantidad (${esc(i.unit)})</label><input type="number" step="0.01" name="qty" value="1" min="0"/></div>
        <div class="f4"><label>Costo unit. (opcional)</label><input type="number" step="0.01" name="unitCost" value="${esc(i.unitCost || 0)}"/></div>
        ${
          mode === "entrada"
            ? `
        <div class="f4"><label>Costo total (opcional)</label><input type="number" step="0.01" name="totalCost" value="0" placeholder="Si lo llenas, calcula costo unit."/></div>
        <div class="f4"><label>Estado de pago</label>
          <select name="payStatus" id="payStatus">
            <option value="pagado">Pagado completo</option>
            <option value="credito">Crédito (pendiente)</option>
            <option value="parcial">Parcial (abonos)</option>
          </select>
        </div>
        <div class="f4"><label>Pagado hoy (COP)</label><input type="number" step="0.01" name="paidNow" id="paidNow" value="0"/></div>
        <div class="f4"><label>Método</label>
          <select name="method" id="method">
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div class="f4"><label>Vence (si hay crédito)</label><input type="date" name="dueDate" id="dueDate" value=""/></div>
        `
            : ""
        }
        <div class="f6"><label>Relacionado con (opcional)</label>
          <select name="linkedType" id="lt">
            <option value="">—</option><option value="sow">Cerda</option><option value="batch">Camada</option>
          </select>
        </div>
        <div class="f6"><label>Seleccionar</label><select name="linkedId" id="lid" disabled><option value="">—</option></select></div>
        <div class="f12"><label>Notas</label><textarea name="notes"></textarea></div>
        ${
          mode === "entrada"
            ? `<div class="f12"><label style="display:flex;gap:10px;align-items:center;cursor:pointer">
          <input id="asExp" type="checkbox" checked style="width:18px;height:18px"/> Registrar como gasto (cantidad×costo unit.)
        </label></div>`
            : ""
        }
      </form>`,
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="ok">Aplicar</button>`,
            onMount: () => {
              const lt = $("#lt"),
                lid = $("#lid");
              // Auto cálculo costo unitario cuando se ingresa costo total
              const totalI = $("#movForm input[name=totalCost]");
              const qtyI = $("#movForm input[name=qty]");
              const ucI = $("#movForm input[name=unitCost]");
              const stI = $("#payStatus");
              const paidI = $("#paidNow");
              const dueI = $("#dueDate");
              function clampPaid() {
                const total = num(totalI?.value);
                if (!stI) return;
                if (stI.value === "pagado") {
                  if (paidI) {
                    paidI.value = String(Math.max(0, total));
                    paidI.disabled = true;
                  }
                  if (dueI) {
                    dueI.value = "";
                    dueI.disabled = true;
                  }
                } else if (stI.value === "credito") {
                  if (paidI) {
                    paidI.value = "0";
                    paidI.disabled = true;
                  }
                  if (dueI) {
                    dueI.disabled = false;
                  }
                } else {
                  if (paidI) {
                    paidI.disabled = false;
                    const p = num(paidI.value);
                    if (p > total) paidI.value = String(Math.max(0, total));
                  }
                  if (dueI) {
                    dueI.disabled = false;
                  }
                }
              }
              function recalcUC() {
                const q = num(qtyI?.value);
                const total = num(totalI?.value);
                if (total > 0 && q > 0 && ucI) {
                  ucI.value = String(Math.round((total / q) * 100) / 100);
                }
                clampPaid();
              }
              if (totalI) totalI.oninput = recalcUC;
              if (qtyI) qtyI.oninput = recalcUC;
              if (stI) stI.onchange = clampPaid;
              if (paidI) paidI.oninput = clampPaid;
              clampPaid();

              lt.onchange = () => {
                lid.innerHTML = `<option value="">—</option>`;
                if (!lt.value) {
                  lid.disabled = true;
                  return;
                }
                lid.disabled = false;
                if (lt.value === "sow") {
                  lid.innerHTML += state.sows
                    .slice()
                    .sort((a, b) => (a.tag || "").localeCompare(b.tag || ""))
                    .map(
                      (s) =>
                        `<option value="${s.id}">${esc(s.tag || s.name || "—")}</option>`,
                    )
                    .join("");
                } else {
                  lid.innerHTML += state.batches
                    .slice()
                    .sort((a, b) =>
                      (b.birthDate || "").localeCompare(a.birthDate || ""),
                    )
                    .map(
                      (b) =>
                        `<option value="${b.id}">${esc(b.id.slice(-8))} • ${esc(get.sow(b.sowId)?.tag || "cerda")}</option>`,
                    )
                    .join("");
                }
              };

              // Si viene forzado (desde cerda/camada), fija y bloquea la selección sin deshabilitar (para que FormData lo capture)
              if (forcedLink && forcedLink.type && forcedLink.id) {
                lt.value = forcedLink.type;
                lt.onchange();
                lid.value = forcedLink.id;
                lt.style.pointerEvents = "none";
                lid.style.pointerEvents = "none";
                lt.style.opacity = ".75";
                lid.style.opacity = ".75";
              }

              $("#ok").onclick = () => {
                const fd = new FormData($("#movForm"));
                const date = (fd.get("date") || today()).toString();
                const qty = num(fd.get("qty"));
                if (qty <= 0) {
                  toast("bad", "Cantidad inválida", "Debe ser > 0.");
                  return;
                }
                const unitCostIn = num(fd.get("unitCost"));
                let unitCost = unitCostIn || num(i.unitCost) || 0;
                const before = num(i.qty);
                const delta = mode === "entrada" ? qty : -qty;
                let after = before + delta;
                if (mode === "salida" && after < 0) {
                  after = 0;
                  toast(
                    "warn",
                    "Stock insuficiente",
                    `Había ${before} ${i.unit}. Se ajustó a 0.`,
                  );
                }
                i.qty = after;
                if (mode === "entrada" && unitCostIn) i.unitCost = unitCostIn;

                state.stockMovements.push({
                  id: uid("mov"),
                  itemId: i.id,
                  type: mode,
                  date,
                  qty: delta,
                  unitCost,
                  linkedType: (fd.get("linkedType") || "").toString(),
                  linkedId: (fd.get("linkedId") || "").toString(),
                  notes: (fd.get("notes") || "").toString().trim(),
                  totalCost: num(fd.get("totalCost")),
                  payStatus: (fd.get("payStatus") || "").toString(),
                  paidNow: num(fd.get("paidNow")),
                  method: (fd.get("method") || "").toString(),
                  dueDate: (fd.get("dueDate") || "").toString(),
                });

                if (mode === "entrada" && $("#asExp")?.checked) {
                  const totalCost = num(fd.get("totalCost"));
                  const status = (fd.get("payStatus") || "pagado").toString();
                  const method = (fd.get("method") || "efectivo").toString();
                  const due = (fd.get("dueDate") || "").toString();

                  // total de la compra: si hay totalCost úsalo; si no, qty×unitCost
                  const total =
                    totalCost > 0 ? totalCost : Math.max(0, qty * unitCost);
                  if (total > 0) {
                    let paidNow = num(fd.get("paidNow"));
                    if (status === "pagado") paidNow = total;
                    if (status === "credito") paidNow = 0;
                    paidNow = Math.max(0, Math.min(total, paidNow));

                    // gasto por lo pagado hoy
                    if (paidNow > 0) {
                      state.transactions.push({
                        id: uid("tx"),
                        date,
                        type: "gasto",
                        category: "Inventario / compra",
                        amount: paidNow,
                        method,
                        refType: "inventory",
                        refId: i.id,
                        notes: `Compra: ${i.name}`,
                      });
                    }

                    const remain = Math.max(0, total - paidNow);
                    if (remain > 0) {
                      state.payables.push({
                        id: uid("pay"),
                        date,
                        category: "Inventario / compra",
                        supplier: i.supplier || "",
                        refType: "inventory",
                        refId: i.id,
                        itemName: i.name,
                        total,
                        paid: paidNow,
                        dueDate: due,
                        method,
                        status: "abierto",
                        notes: `Compra: ${i.name}`,
                      });
                    }
                  }
                }

                save();
                dlg.close();
                toast(
                  "ok",
                  "Aplicado",
                  `${i.name}: ${before} → ${after} ${i.unit}`,
                );
                render();
              };
            },
          });
        }

        function openMovs() {
          const rows = state.stockMovements
            .slice()
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
            .slice(0, 250)
            .map((m) => {
              const item = m.itemId ? get.inv(m.itemId) : null;
              const q = num(m.qty);
              return `<tr>
        <td class="mono">${esc(m.date || "—")}</td>
        <td>${esc(item?.name || "—")}<div class="muted">${esc(item?.category || "")}</div></td>
        <td>${q > 0 ? `<span class="tag ok">+${q}</span>` : q < 0 ? `<span class="tag bad">${q}</span>` : `<span class="tag">${q}</span>`} <span class="muted">${esc(item?.unit || "")}</span></td>
        <td class="mono">${esc(m.linkedType || "—")} ${m.linkedId ? esc(m.linkedId.slice(-6)) : ""}</td>
        <td class="muted">${esc(m.notes || "")}</td>
      </tr>`;
            })
            .join("");
          openModal({
            title: "Movimientos de inventario",
            sub: "Últimos 250 registros.",
            body: `<div class="wrap"><table><thead><tr><th>Fecha</th><th>Insumo</th><th>Cantidad</th><th>Relacionado</th><th>Notas</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5" class="muted">Sin movimientos.</td></tr>`}</tbody></table></div>`,
            footer: `<button class="btn" id="mClose">Cerrar</button>`,
          });
        }

        // ------- Clientes y Ventas -------
        function renderSales() {
          const rows = state.sales
            .filter((s) => {
              const c = get.client(s.clientId);
              const b = get.batch(s.batchId);
              const sow = b ? get.sow(b.sowId) : null;
              return matchQ(
                s.date,
                s.status,
                s.notes,
                c?.name,
                c?.phone,
                b?.id,
                sow?.tag,
              );
            })
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
            .map((s) => {
              const c = get.client(s.clientId);
              const b = get.batch(s.batchId);
              const pending = Math.max(0, num(s.total) - num(s.paidAmount));
              const tag =
                s.status === "pagado"
                  ? `<span class="tag ok">Pagado</span>`
                  : s.status === "parcial"
                    ? `<span class="tag warn">Parcial</span>`
                    : `<span class="tag bad">Pendiente</span>`;
              return `<tr>
          <td class="mono">${esc(s.date)}</td>
          <td><b>${esc(c?.name || "—")}</b><div class="muted">${esc(c?.phone || "")}</div></td>
          <td class="mono">${esc(b ? b.id.slice(-8) : "—")}</td>
          <td class="mono">${esc(s.qty)}</td>
          <td class="mono">${esc(fmtCOP(s.total))}</td>
          <td>${tag}<div class="muted">Pend: ${esc(fmtCOP(pending))}</div></td>
          <td>
            <button class="btn" data-act="pay" data-id="${s.id}">Abonar</button>
            <button class="btn" data-act="detail" data-id="${s.id}">Ver</button>
            <button class="btn danger" data-act="del" data-id="${s.id}">Eliminar</button>
          </td>
        </tr>`;
            })
            .join("");

          view.innerHTML = shell(
            "Ventas",
            "Venta de lechones con control de abonos (COP) y saldo pendiente.",
            `<button class="btn primary" id="sale">💳 Nueva venta</button><button class="btn" id="client">👤 Nuevo cliente</button>`,
            `<div class="wrap"><table>
        <thead><tr><th>Fecha</th><th>Cliente</th><th>Camada</th><th>Cant.</th><th>Total</th><th>Estado</th><th>Inversión</th><th>Acciones</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="7" class="muted">Sin ventas.</td></tr>`}</tbody>
      </table></div>`,
          );

          $("#sale").onclick = () => openSale();
          $("#client").onclick = () => openClient();

          view.onclick = (e) => {
            const b = e.target.closest("button[data-act]");
            if (!b) return;
            const id = b.dataset.id,
              act = b.dataset.act;
            if (act === "pay") openPayment(id);
            if (act === "detail") saleDetail(id);
            if (act === "del") delSale(id);
          };
        }

        function clientForm(c) {
          c = c || { name: "", phone: "", email: "", address: "", notes: "" };
          return `<form id="clientForm" class="grid2">
      <div class="f6"><label>Nombre *</label><input name="name" required value="${esc(c.name)}"/></div>
      <div class="f3"><label>Teléfono</label><input name="phone" value="${esc(c.phone)}"/></div>
      <div class="f3"><label>Correo</label><input type="email" name="email" value="${esc(c.email)}"/></div>
      <div class="f12"><label>Dirección</label><input name="address" value="${esc(c.address)}"/></div>
      <div class="f12"><label>Notas</label><textarea name="notes">${esc(c.notes)}</textarea></div>
    </form>
`;
        }

        function openClient(id) {
          const c = id ? get.client(id) : null;
          openModal({
            title: id ? "Editar cliente" : "Nuevo cliente",
            sub: "Clientes para historial y cobros.",
            body: clientForm(c),
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="save">Guardar</button>`,
            onMount: () => {
              $("#save").onclick = () => {
                const fd = new FormData($("#clientForm"));
                const name = (fd.get("name") || "").toString().trim();
                if (!name) {
                  toast("bad", "Falta nombre", "Obligatorio.");
                  return;
                }
                const payload = {
                  id: id || uid("cli"),
                  name,
                  phone: (fd.get("phone") || "").toString().trim(),
                  email: (fd.get("email") || "").toString().trim(),
                  address: (fd.get("address") || "").toString().trim(),
                  notes: (fd.get("notes") || "").toString().trim(),
                };
                if (id)
                  state.clients = state.clients.map((x) =>
                    x.id === id ? payload : x,
                  );
                else state.clients.push(payload);
                save();
                dlg.close();
                toast("ok", "Guardado", "Cliente guardado.");
                render();
              };
            },
          });
        }

        function saleForm(s, preset = {}) {
          if (!state.clients.length)
            return `<div class="muted">Primero crea un cliente.</div>`;
          const availableBatches = state.batches.filter(
            (b) =>
              (b.status || "disponible") !== "cerrado" &&
              num(b.countCurrent) > 0,
          );
          if (!availableBatches.length)
            return `<div class="muted">No hay camadas disponibles. Registra un parto primero.</div>`;

          s = s || {
            date: today(),
            clientId: preset.clientId || "",
            sowId: preset.sowId || "",
            batchId: preset.batchId || "",
            qty: 0,
            unitPrice: 0,
            total: 0,
            status: "credito",
            paidAmount: 0,
            dueDate: "",
            notes: "",
          };

          // Si no hay sowId pero hay batchId, precarga la cerda desde la camada
          if (!s.sowId && s.batchId) {
            const bb = get.batch(s.batchId);
            if (bb?.sowId) s.sowId = bb.sowId;
          }

          const clientOps = state.clients
            .slice()
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
            .map(
              (c) =>
                `<option value="${c.id}" ${s.clientId === c.id ? "selected" : ""}>${esc(c.name)}</option>`,
            )
            .join("");

          const sowIds = [
            ...new Set(availableBatches.map((b) => b.sowId).filter(Boolean)),
          ];
          const sowOps = sowIds
            .map((id) => get.sow(id))
            .filter(Boolean)
            .sort((a, b) => (a.tag || "").localeCompare(b.tag || ""))
            .map(
              (sw) =>
                `<option value="${sw.id}" ${s.sowId === sw.id ? "selected" : ""}>${esc(sw.tag)} • ${esc(sw.breed || "")}</option>`,
            )
            .join("");

          const filteredBatches = s.sowId
            ? availableBatches.filter((b) => b.sowId === s.sowId)
            : availableBatches;
          const batchOps = filteredBatches
            .slice()
            .sort((a, b) =>
              (b.birthDate || "").localeCompare(a.birthDate || ""),
            )
            .map((b) => {
              const sow = get.sow(b.sowId);
              return `<option value="${b.id}" ${s.batchId === b.id ? "selected" : ""}>${esc(b.birthDate || "—")} • ${esc(sow?.tag || "cerda")} • Disp ${esc(b.countCurrent)}</option>`;
            })
            .join("");

          return `<form id="saleForm" class="grid2">
      <div class="f4"><label>Fecha *</label><input type="date" name="date" required value="${esc(s.date)}"/></div>

      <div class="f8"><label>Cliente *</label>
        <select name="clientId" required><option value="">Selecciona</option>${clientOps}</select>
      </div>

      <div class="f8"><label>Cerda *</label>
        <select name="sowId" id="saleSow" required><option value="">Selecciona</option>${sowOps}</select>
        <div class="muted" style="margin-top:6px;font-size:12px">Se llena para asociar la ganancia a la cerda.</div>
      </div>

      <div class="f8"><label>Camada *</label>
        <select name="batchId" id="saleBatch" required><option value="">Selecciona</option>${batchOps}</select>
        <div class="muted" style="margin-top:6px;font-size:12px">Solo camadas con stock disponible.</div>
      </div>

      <div class="f4"><label>Cantidad *</label><input type="number" name="qty" id="sq" required min="1" value="${esc(s.qty)}"/></div>
      <div class="f4"><label>Precio unitario (COP) *</label><input type="number" name="unitPrice" id="su" required min="0" value="${esc(s.unitPrice)}"/></div>
      <div class="f4"><label>Total (auto)</label><input type="number" name="total" id="st" readonly value="${esc(s.total)}"/></div>

      <div class="f4"><label>Estado</label>
        <select name="status" id="ss">
          ${["pagado", "parcial", "credito"].map((x) => `<option value="${x}" ${s.status === x ? "selected" : ""}>${x}</option>`).join("")}
        </select>
      </div>

      <div class="f4"><label>Pagado hoy (COP)</label><input type="number" name="paidAmount" id="sp" min="0" value="${esc(s.paidAmount)}"/></div>
      <div class="f4"><label>Vence</label><input type="date" name="dueDate" value="${esc(s.dueDate)}"/></div>

      <div class="f12"><label>Notas</label><textarea name="notes">${esc(s.notes || "")}</textarea></div>
    </form>`;
        }

        function openSale(id, preset = {}) {
          if (!state.clients.length) {
            toast("warn", "Sin clientes", "Crea un cliente.");
            openClient();
            return;
          }
          if (
            !state.batches.some(
              (b) =>
                (b.status || "disponible") !== "cerrado" &&
                num(b.countCurrent) > 0,
            )
          ) {
            toast("warn", "Sin camadas", "Registra un parto/camada primero.");
            current = "litters";
            renderNav();
            render();
            return;
          }

          const s = id ? get.sale(id) : null;
          openModal({
            title: id ? "Editar venta" : "Nueva venta",
            sub: "Descuenta stock de lechones y gestiona abonos.",
            body: saleForm(s, preset),
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="save">Guardar</button>`,
            onMount: () => {
              const sq = $("#sq"),
                su = $("#su"),
                st = $("#st"),
                ss = $("#ss"),
                sp = $("#sp");
              const sowSel = $("#saleSow");
              const batchSel = $("#saleBatch");
              const allBatches = state.batches.filter(
                (b) =>
                  (b.status || "disponible") !== "cerrado" &&
                  num(b.countCurrent) > 0,
              );

              const rebuildBatches = (keep = "") => {
                if (!batchSel) return;
                const sowId = sowSel?.value || "";
                const list = sowId
                  ? allBatches.filter((b) => b.sowId === sowId)
                  : allBatches;
                const ops = list
                  .slice()
                  .sort((a, b) =>
                    (b.birthDate || "").localeCompare(a.birthDate || ""),
                  )
                  .map((b) => {
                    const sow = get.sow(b.sowId);
                    return `<option value="${b.id}">${esc(b.birthDate || "—")} • ${esc(sow?.tag || "cerda")} • Disp ${esc(b.countCurrent)}</option>`;
                  })
                  .join("");
                batchSel.innerHTML =
                  `<option value="">Selecciona</option>` + ops;
                if (keep && list.some((x) => x.id === keep))
                  batchSel.value = keep;
              };

              const syncFromBatch = () => {
                const bb = get.batch(batchSel?.value || "");
                if (bb && sowSel) sowSel.value = bb.sowId || "";
              };

              if (sowSel) {
                sowSel.onchange = () => {
                  // al cambiar cerda, resetear camada
                  rebuildBatches("");
                };
              }
              if (batchSel) {
                batchSel.onchange = () => {
                  syncFromBatch();
                  // reconstruir manteniendo la misma camada (por si lista estaba sin filtrar)
                  rebuildBatches(batchSel.value);
                };
              }

              // Inicial (si viene con batchId)
              if (batchSel?.value) {
                syncFromBatch();
              }
              rebuildBatches(batchSel?.value || "");

              const recalc = () => {
                const t = Math.max(0, num(sq.value) * num(su.value));
                setMoney(st, t);
                if (ss.value === "pagado") setMoney(sp, t);
                if (ss.value === "credito") setMoney(sp, 0);
                const p = num(sp.value);
                if (p > t) setMoney(sp, t);
              };
              sq.oninput = recalc;
              su.oninput = recalc;
              ss.onchange = recalc;
              sp.oninput = recalc;
              recalc();

              $("#save").onclick = () => saveSale(id);
            },
          });
        }

        function saveSale(id) {
          const fd = new FormData($("#saleForm"));
          const date = (fd.get("date") || "").toString();
          const clientId = (fd.get("clientId") || "").toString();
          const sowId = (fd.get("sowId") || "").toString();
          const batchId = (fd.get("batchId") || "").toString();
          const qty = num(fd.get("qty"));
          const unitPrice = num(fd.get("unitPrice"));
          const total = Math.max(0, qty * unitPrice);
          let paid = Math.max(0, num(fd.get("paidAmount")));
          let status = (fd.get("status") || "credito").toString();
          if (!date || !clientId || !batchId || qty <= 0) {
            openAlert({
              title: "Faltan datos",
              message:
                "Debes seleccionar fecha, cliente, cerda, camada y cantidad.",
              kind: "bad",
            });
            return;
          }
          const batch = get.batch(batchId);
          if (!batch) {
            openAlert({
              title: "Camada inválida",
              message: "Selecciona una camada válida.",
              kind: "bad",
            });
            return;
          }
          const sowIdFinal = sowId || batch?.sowId || "";
          if (!sowIdFinal) {
            openAlert({
              title: "Faltan datos",
              message: "Debes seleccionar la cerda.",
              kind: "bad",
            });
            return;
          }
          if (batch.sowId && sowIdFinal && batch.sowId !== sowIdFinal) {
            openAlert({
              title: "Cerda/Camada no coinciden",
              message: "Selecciona la camada correcta para esa cerda.",
              kind: "bad",
            });
            return;
          }

          if (!id) {
            const available = num(batch.countCurrent);
            if (qty > available) {
              toast("bad", "Stock insuficiente", `Disponible ${available}.`);
              return;
            }
          } else {
            const old = get.sale(id);
            if (old && (old.batchId !== batchId || old.qty !== qty)) {
              toast(
                "warn",
                "Restricción v1",
                "Para cambiar camada/cantidad elimina y crea una nueva venta.",
              );
              return;
            }
          }

          if (paid >= total) {
            paid = total;
            status = "pagado";
          } else if (paid > 0) status = "parcial";
          else status = status === "pagado" ? "credito" : status;

          const payload = {
            id: id || uid("sale"),
            date,
            clientId,
            sowId: sowIdFinal,
            batchId,
            qty,
            unitPrice,
            total,
            status,
            paidAmount: paid,
            dueDate: (fd.get("dueDate") || "").toString(),
            notes: (fd.get("notes") || "").toString().trim(),
          };

          if (id) {
            const prev = get.sale(id);
            if (!prev) {
              toast("bad", "No encontrada", "La venta no existe.");
              return;
            }

            const prevBatch = get.batch(prev.batchId || "");
            const newBatch = get.batch(batchId || "");
            if (!newBatch) {
              openAlert({
                title: "Faltan datos",
                message: "Selecciona una camada válida.",
                kind: "bad",
              });
              return;
            }

            // Disponibilidad: si es la misma camada, permite usar el stock + lo que ya había vendido en esta venta
            const available =
              num(newBatch.countCurrent) +
              (prev.batchId === batchId ? num(prev.qty) : 0);
            if (qty > available) {
              openAlert({
                title: "Stock insuficiente",
                message: `Disponible en la camada: ${fmtNum(available)} und. Estás intentando vender: ${fmtNum(qty)}.`,
                kind: "bad",
              });
              return;
            }

            // Si hay pagos registrados, se usa la suma real
            const paidSum = (state.payments || [])
              .filter((p) => p.saleId === id)
              .reduce((a, p) => a + num(p.amount), 0);
            const paidFinal = paidSum > 0 ? paidSum : paid;
            if (paidFinal > total) {
              openAlert({
                title: "Abonos superan el total",
                message: `Esta venta tiene abonos por ${fmtCOP(paidFinal)}. El total (${fmtCOP(total)}) no puede ser menor.`,
                kind: "bad",
              });
              return;
            }

            // Restaurar stock de la venta anterior
            if (prevBatch) {
              prevBatch.countCurrent = Math.max(
                0,
                num(prevBatch.countCurrent) + num(prev.qty),
              );
              if (
                num(prevBatch.countCurrent) > 0 &&
                (prevBatch.status || "") === "cerrado"
              )
                prevBatch.status = "disponible";
            }

            // Descontar stock en la nueva venta
            newBatch.countCurrent = Math.max(
              0,
              num(newBatch.countCurrent) - qty,
            );
            if (newBatch.countCurrent <= 0) newBatch.status = "cerrado";

            const sowIdFinal = sowId || newBatch.sowId || "";
            if (!sowIdFinal) {
              openAlert({
                title: "Faltan datos",
                message:
                  "Selecciona la cerda (o usa una camada ligada a una cerda).",
                kind: "bad",
              });
              return;
            }

            const pending = Math.max(0, total - paidFinal);
            const statusFinal =
              pending <= 0 ? "pagado" : paidFinal > 0 ? "parcial" : "credito";

            const payload = {
              id,
              date,
              clientId,
              sowId: sowIdFinal,
              batchId,
              qty,
              unitPrice,
              total,
              paidAmount: paidFinal,
              status: statusFinal,
              notes,
            };

            state.sales = state.sales.map((x) => (x.id === id ? payload : x));

            // Actualizar tarea de cobro
            state.tasks = (state.tasks || []).filter(
              (t) =>
                !(
                  t.relatedType === "sale" &&
                  t.relatedId === id &&
                  (t.title || "").startsWith("Cobro pendiente")
                ),
            );
            if (pending > 0) {
              state.tasks.push({
                id: uid("tsk"),
                title: `Cobro pendiente — ${get.client(clientId)?.name || "cliente"}`,
                dueDate: addDays(date, 7),
                priority: "alta",
                status: "pendiente",
                relatedType: "sale",
                relatedId: id,
                notes: `Saldo: ${fmtCOP(pending)}`,
              });
            }

            save();
            dlg.close();
            toast("ok", "Actualizado", "Venta actualizada.");
            render();
            return;
          }

          state.sales.push(payload);
          batch.countCurrent = Math.max(0, num(batch.countCurrent) - qty);
          if (num(batch.countCurrent) === 0) batch.status = "cerrado";

          if (paid > 0) {
            state.payments.push({
              id: uid("pay"),
              saleId: payload.id,
              date,
              amount: paid,
              method: "efectivo",
              notes: "Abono inicial",
            });
            state.transactions.push({
              id: uid("tx"),
              date,
              type: "ingreso",
              category: "Venta de lechones",
              amount: paid,
              method: "efectivo",
              refType: "sale",
              refId: payload.id,
              notes: `Venta ${payload.id.slice(-6)} • ${qty} und`,
            });
          }
          const pending = Math.max(0, total - paid);
          if (pending > 0) {
            state.tasks.push({
              id: uid("tsk"),
              title: `Cobro pendiente — ${get.client(clientId)?.name || "cliente"}`,
              dueDate: payload.dueDate || addDays(date, 7),
              priority: "alta",
              status: "pendiente",
              relatedType: "sale",
              relatedId: payload.id,
              notes: `Saldo: ${fmtCOP(pending)}`,
            });
          }

          save();
          dlg.close();
          toast("ok", "Guardado", "Venta registrada.");
          render();
        }

        function openPayment(saleId) {
          const s = get.sale(saleId);
          if (!s) return;
          const total = num(s.total);
          const paid0 = num(s.paidAmount);
          let pending = Math.max(0, total - paid0);
          if (pending <= 0) {
            toast("ok", "Sin saldo", "La venta ya está pagada.");
            return;
          }

          const pays = (state.payments || [])
            .filter((p) => p.saleId === saleId)
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
          const pct0 =
            total > 0 ? Math.min(100, Math.round((paid0 / total) * 100)) : 0;

          openModal({
            title: "Registrar abono",
            sub: `Venta ${saleId.slice(-6)} • Pendiente: ${fmtCOP(pending)}`,
            body: `
        <div class="payTop">
          <div class="paySummary">
            <div class="payKpi"><div class="muted">Total</div><b>${fmtCOP(total)}</b></div>
            <div class="payKpi"><div class="muted">Abonado</div><b class="mono" id="payNowPaid">${fmtCOP(paid0)}</b></div>
            <div class="payKpi"><div class="muted">Pendiente</div><b class="mono" id="payNowPend">${fmtCOP(pending)}</b></div>
          </div>
          <div class="prog" title="Progreso de cobro"><div class="bar" id="payProgBar" style="width:${pct0}%"></div></div>
          <div class="muted" style="margin-top:8px">Progreso: <b id="payPct">${pct0}%</b></div>
        </div>

        <form id="payForm" class="grid2" style="margin-top:12px">
          <div class="f4"><label>Fecha</label><input type="date" name="date" value="${today()}"/></div>
          <div class="f4"><label>Método</label>
            <select name="method">
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="nequi">Nequi/Daviplata</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div class="f12">
            <label>Valor a abonar (COP) *</label>
            <input type="number" id="payAmount" name="amount" min="0" step="1" value="${Math.min(pending, Math.max(0, total))}"/>
            <input type="range" id="payRange" min="0" max="${Math.max(1, Math.floor(pending))}" step="1" value="${Math.min(pending, Math.max(0, total))}"/>
            <div class="chips">
              <button class="btn chip" type="button" data-set="25">25%</button>
              <button class="btn chip" type="button" data-set="50">50%</button>
              <button class="btn chip" type="button" data-set="all">Todo</button>
              <span class="muted" id="payClamp" style="display:none;margin-left:auto">Se ajustó al pendiente.</span>
            </div>
            <div class="helpLine">
              Después de este abono: <b class="mono" id="payAfterPaid">${fmtCOP(Math.min(total, paid0 + Math.min(pending, Math.max(0, total))))}</b>
              • Pendiente: <b class="mono" id="payAfterPend">${fmtCOP(Math.max(0, total - (paid0 + Math.min(pending, Math.max(0, total)))))}</b>
            </div>
          </div>

          <div class="f12"><label>Notas</label><textarea name="notes" placeholder="Referencia, observación…"></textarea></div>
        </form>

        <div class="helpCard" style="margin-top:12px">
          <div class="helpHd">
            <div><b>Últimos abonos</b><div class="muted">Historial (reciente)</div></div>
            <span class="tag info">${pays.length}</span>
          </div>
          <div class="wrap"><table>
            <thead><tr><th>Fecha</th><th>Método</th><th>Valor</th><th>Notas</th></tr></thead>
            <tbody>
              ${
                pays
                  .slice(0, 6)
                  .map(
                    (p) =>
                      `<tr><td class="mono">${esc(p.date || "—")}</td><td>${esc(p.method || "—")}</td><td class="mono">${fmtCOP(p.amount)}</td><td>${esc(p.notes || "")}</td></tr>`,
                  )
                  .join("") ||
                `<tr><td colspan="4" class="muted">Sin abonos aún.</td></tr>`
              }
            </tbody>
          </table></div>
        </div>
      `,
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="ok">Registrar abono</button>`,
            onMount: () => {
              const amount = $("#payAmount");
              const range = $("#payRange");
              const pct = $("#payPct");
              const bar = $("#payProgBar");
              const clamp = $("#payClamp");
              const nowPaid = $("#payNowPaid");
              const nowPend = $("#payNowPend");
              const afterPaid = $("#payAfterPaid");
              const afterPend = $("#payAfterPend");

              const round100 = (x) => x;

              const sync = (src) => {
                pending = Math.max(0, num(s.total) - num(s.paidAmount));
                const maxv = Math.max(0, Math.floor(pending));
                range.max = String(Math.max(1, maxv || 1));

                let v = num(amount.value);
                if (src === "range") v = num(range.value);

                const wasOver = v > pending;
                v = Math.max(0, Math.min(v, pending));
                v = round100(v);
                if (v > pending) v = pending; // por redondeo

                amount.value = moneyFormatStr(v);
                range.value = String(Math.min(v, maxv));
                // mantiene el input formateado
                amount.value = moneyFormatStr(v);

                clamp.style.display = wasOver ? "inline" : "none";

                const paid1 = Math.min(total, paid0 + v);
                const pend1 = Math.max(0, total - paid1);

                nowPaid.textContent = fmtCOP(paid0);
                nowPend.textContent = fmtCOP(pending);
                afterPaid.textContent = fmtCOP(paid1);
                afterPend.textContent = fmtCOP(pend1);

                const pct1 =
                  total > 0
                    ? Math.min(100, Math.round((paid1 / total) * 100))
                    : 0;
                pct.textContent = pct1 + "%";
                bar.style.width = pct1 + "%";
              };

              amount.oninput = () => sync("amount");
              range.oninput = () => sync("range");
              $$(".chips button[data-set]").forEach(
                (b) =>
                  (b.onclick = () => {
                    const k = b.dataset.set;
                    let v = 0;
                    if (k === "25") v = pending * 0.25;
                    if (k === "50") v = pending * 0.5;
                    if (k === "all") v = pending;
                    amount.value = moneyFormatStr(round100(v));
                    sync("amount");
                  }),
              );

              sync("amount");

              $("#ok").onclick = () => {
                const fd = new FormData($("#payForm"));
                const date = (fd.get("date") || today()).toString();
                const method = (fd.get("method") || "efectivo").toString();
                let amountV = num(fd.get("amount"));
                if (!date) {
                  openAlert({
                    title: "Faltan datos",
                    message: "Ingresa la fecha.",
                    kind: "bad",
                  });
                  return;
                }
                if (amountV <= 0) {
                  openAlert({
                    title: "Valor inválido",
                    message: "El abono debe ser mayor a 0.",
                    kind: "bad",
                  });
                  return;
                }

                const pendNow = Math.max(0, num(s.total) - num(s.paidAmount));
                amountV = Math.min(round100(amountV), pendNow);
                if (amountV <= 0) {
                  openAlert({
                    title: "Sin saldo",
                    message: "No hay saldo pendiente para abonar.",
                    kind: "bad",
                  });
                  return;
                }

                s.paidAmount = num(s.paidAmount) + amountV;
                const newPending = Math.max(
                  0,
                  num(s.total) - num(s.paidAmount),
                );
                s.status = newPending <= 0 ? "pagado" : "parcial";

                state.payments = state.payments || [];
                state.payments.push({
                  id: uid("pay"),
                  saleId: s.id,
                  date,
                  amount: amountV,
                  method,
                  notes: (fd.get("notes") || "").toString().trim(),
                });
                state.transactions.push({
                  id: uid("tx"),
                  date,
                  type: "ingreso",
                  category: "Ventas / lechones",
                  amount: amountV,
                  method,
                  refType: "sale",
                  refId: s.id,
                  notes: `Abono a ${s.id.slice(-6)}`,
                });

                if (newPending <= 0) {
                  state.tasks.forEach((t) => {
                    if (
                      t.relatedType === "sale" &&
                      t.relatedId === s.id &&
                      (t.title || "").startsWith("Cobro pendiente")
                    )
                      t.status = "hecha";
                  });
                }

                save();
                dlg.close();
                toast(
                  "ok",
                  "Abono registrado",
                  `Nuevo saldo: ${fmtCOP(newPending)}`,
                );
                render();
              };
            },
          });
        }

        function saleDetail(id) {
          const s = get.sale(id);
          if (!s) return;
          const c = get.client(s.clientId);
          const b = get.batch(s.batchId);
          const pays = state.payments
            .filter((p) => p.saleId === id)
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
          const pending = Math.max(0, num(s.total) - num(s.paidAmount));
          openModal({
            title: `Venta ${s.id.slice(-6)}`,
            sub: `${c?.name || "Cliente"} • ${s.date} • Pendiente ${fmtCOP(pending)}`,
            body: `<div class="grid">
        <div class="card"><div class="bd">
          <div class="row">
            <div><div class="muted">Cliente</div><b>${esc(c?.name || "—")}</b><div class="muted">${esc(c?.phone || "")}</div></div>
            <div><div class="muted">Camada</div><b class="mono">${esc(b ? b.id.slice(-8) : "—")}</b><div class="muted">Cant: ${esc(s.qty)}</div></div>
            <div><div class="muted">Total</div><b>${fmtCOP(s.total)}</b><div class="muted">Abonado: ${fmtCOP(s.paidAmount)} • Pend: ${fmtCOP(pending)}</div></div>
          </div>
        </div></div>
        <div class="card"><div class="hd"><div><h2>Abonos</h2><p>Historial</p></div></div><div class="bd">
          <div class="wrap"><table><thead><tr><th>Fecha</th><th>Método</th><th>Valor</th><th>Notas</th></tr></thead>
            <tbody>${pays.map((p) => `<tr><td class="mono">${esc(p.date)}</td><td>${esc(p.method || "—")}</td><td class="mono">${esc(fmtCOP(p.amount))}</td><td class="muted">${esc(p.notes || "")}</td></tr>`).join("") || `<tr><td colspan="4" class="muted">Sin abonos.</td></tr>`}</tbody>
          </table></div>
        </div></div>
      </div>`,
            footer: `<button class="btn" id="mClose">Cerrar</button><button class="btn primary" id="pay">Abonar</button>`,
            onMount: () => {
              $("#pay").onclick = () => {
                dlg.close();
                openPayment(id);
              };
            },
          });
        }

        function delSale(id) {
          const s = get.sale(id);
          if (!s) return;
          openModal({
            title: "Eliminar venta",
            sub: "Opcional: devolver stock a la camada.",
            body: `<div class="muted">Venta <b class="mono">${esc(s.id.slice(-6))}</b> • ${esc(s.date)}</div>
        <div style="margin-top:10px">
          <label>Devolver stock</label>
          <select id="restock"><option value="no">No</option><option value="yes">Sí, devolver a la camada</option></select>
        </div>`,
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn danger" id="ok">Eliminar</button>`,
            onMount: () => {
              $("#ok").onclick = () => {
                if ($("#restock").value === "yes") {
                  const b = get.batch(s.batchId);
                  if (b) {
                    b.countCurrent = num(b.countCurrent) + num(s.qty);
                    if (b.countCurrent > 0 && b.status === "cerrado")
                      b.status = "disponible";
                  }
                }
                state.sales = state.sales.filter((x) => x.id !== id);
                state.payments = state.payments.filter((p) => p.saleId !== id);
                state.transactions = state.transactions.filter(
                  (t) => !(t.refType === "sale" && t.refId === id),
                );
                state.tasks = state.tasks.filter(
                  (t) => !(t.relatedType === "sale" && t.relatedId === id),
                );
                save();
                dlg.close();
                toast("ok", "Eliminada", "Venta eliminada.");
                render();
              };
            },
          });
        }

        // ------- Carne (ventas por kilos) -------
        const GESTATION_DAYS = 115;
        const WEAN_DAYS = 25; // destete sugerido
        const FATTEN_DAYS = 48; // a los 48 días pasan a engorde
        const PIGLET_DAYS_FOR_MEAT = FATTEN_DAYS; // referencia para carne

        function meatEligibleHeads() {
          // Cerdos en engorde automáticos desde camadas (no vendidos a los 48 días)
          return Math.max(0, num(state.meat?.headsAuto));
        }

        function meatStats() {
          const rows = state.meatSales || [];
          const total = rows.reduce((a, s) => a + num(s.total), 0);
          const paid = rows.reduce((a, s) => a + num(s.paidAmount), 0);
          const pending = Math.max(0, total - paid);
          const kgSold = rows.reduce((a, s) => a + num(s.qty), 0);
          return {
            total,
            paid,
            pending,
            kgSold,
            stockKg: num(state.meat?.stockKg),
          };
        }

        function renderMeat() {
          auditState();
          const st = meatStats();

          const actions = `
      <button class="btn" id="meatStockBtn">🥩 Stock (kg)</button>
      <button class="btn" id="meatHeadsBtn">🐷 Cerdos para carne</button>
      <button class="btn primary" id="meatNew">➕ Nueva venta (kg)</button>
    `;

          const body = `
      <div class="kpis">
        ${kpi("Stock carne (kg)", fmtNum(st.stockKg, 2) + " kg", st.stockKg <= 0 ? "warn" : "ok")}
        ${kpi("Cerdos (engorde)", fmtNum(num(state.meat?.headsForSale), 0), num(state.meat?.headsForSale) <= 0 ? "warn" : "info")}
        ${kpi("Kg vendidos", fmtNum(st.kgSold, 2) + " kg", "info")}
        ${kpi("Ingresos (carne)", fmtCOP(st.total), "ok")}
        ${kpi("Pendiente por cobrar", fmtCOP(st.pending), st.pending > 0 ? "warn" : "ok")}
      </div>

      <div class="helpCard" style="margin-top:12px">
        <div class="helpHd">
          <div>
            <b>Disponibilidad (referencia)</b>
            <div class="muted">Automático: al día ${PIGLET_DAYS_FOR_MEAT}, lo no vendido pasa a engorde y aparece aquí.</div>
          </div>
          <span class="tag info">Engorde automático: ${fmtNum(meatEligibleHeads(), 0)} cerdos</span>
        </div>
        <div class="muted" style="margin-top:8px">
          Puedes registrar manualmente cuántos cerdos tienes disponibles para carne (sin afectar camadas) y manejar el stock por kg.
        </div>
        <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
          <span class="tag ok">Disponibles para carne (manual): <b>${fmtNum(num(state.meat?.headsForSale), 0)}</b> cerdos</span>
          <span class="tag info">Stock carne (kg): <b>${fmtNum(num(state.meat?.stockKg), 2)}</b> kg</span>
        </div>
      </div>

      <div class="card" style="margin-top:12px">
        <div class="cardHd">
          <b>Ventas de carne (kg)</b>
          <div class="muted">Filtra con el buscador general de la izquierda (cliente, fecha, estado…).</div>
        </div>
        <div class="wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th><th>Cliente</th><th>Kg</th><th>Precio/kg</th><th>Total</th><th>Abonado</th><th>Estado</th><th class="r">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${
                (state.meatSales || [])
                  .filter((s) => {
                    const c = get.client(s.clientId);
                    return matchQ(
                      s.date,
                      s.status,
                      s.notes,
                      c?.name,
                      c?.phone,
                      s.qty,
                      s.total,
                    );
                  })
                  .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
                  .map((s) => {
                    const c = get.client(s.clientId);
                    const pend = Math.max(0, num(s.total) - num(s.paidAmount));
                    return `<tr>
                    <td class="mono">${esc(s.date || "—")}</td>
                    <td>${esc(c?.name || "—")}</td>
                    <td class="mono">${fmtNum(num(s.qty), 2)}</td>
                    <td class="mono">${fmtCOP(num(s.unitPrice))}</td>
                    <td class="mono">${fmtCOP(num(s.total))}</td>
                    <td class="mono">${fmtCOP(num(s.paidAmount))}</td>
                    <td><span class="tag ${s.status === "pagado" ? "ok" : s.status === "parcial" ? "warn" : "info"}">${esc(s.status || "")}</span></td>
                    <td class="r">
                      ${pend > 0 ? `<button class="btn" data-mpay="${s.id}">Abonar</button>` : ""}
                      <button class="btn" data-medit="${s.id}">Editar</button>
                      <button class="btn danger" data-mdel="${s.id}">Eliminar</button>
                    </td>
                  </tr>`;
                  })
                  .join("") ||
                `<tr><td colspan="8" class="muted">Aún no hay ventas de carne registradas.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

          view.innerHTML = shell(
            "Carne (Kg)",
            "Ventas a carnicerías y clientes por kg. Controla stock (kg), abonos y tareas de cobro.",
            actions,
            body,
          );

          const btnNew = $("#meatNew");
          const btnStock = $("#meatStockBtn");
          const btnHeads = $("#meatHeadsBtn");
          if (btnNew) btnNew.onclick = () => openMeatSale();
          if (btnStock) btnStock.onclick = () => openMeatStock();
          if (btnHeads) btnHeads.onclick = () => openMeatHeads();

          view
            .querySelectorAll("button[data-medit]")
            .forEach((b) => (b.onclick = () => openMeatSale(b.dataset.medit)));
          view
            .querySelectorAll("button[data-mdel]")
            .forEach((b) => (b.onclick = () => delMeatSale(b.dataset.mdel)));
          view
            .querySelectorAll("button[data-mpay]")
            .forEach(
              (b) => (b.onclick = () => openMeatPayment(b.dataset.mpay)),
            );
        }

        function openMeatHeads() {
          auditState();
          const auto = Math.max(0, num(state.meat?.headsAuto));
          state.meat = state.meat || {
            stockKg: 0,
            headsForSale: 0,
            headsManual: 0,
            movements: [],
          };
          if (state.meat.headsManual == null)
            state.meat.headsManual = num(state.meat.headsForSale);

          const manual = Math.max(0, num(state.meat.headsManual));
          const total = Math.max(0, auto + manual);

          openModal({
            title: "Cerdos disponibles para carne",
            sub: "Automático desde camadas (48 días) + ajuste manual adicional.",
            body: `<form id="mhForm" class="grid2">
        <div class="f4">
          <label>Automático (desde camadas)</label>
          <input readonly value="${fmtNum(auto, 0)}" />
          <div class="muted" style="margin-top:6px">Se mueve automáticamente cuando la camada cumple 48 días (si quedan sin vender).</div>
        </div>
        <div class="f4">
          <label>Manual adicional</label>
          <input name="manual" data-qty="1" value="${fmtNum(manual, 0)}" />
          <div class="muted" style="margin-top:6px">Usa esto si compraste/añadiste cerdos extra para carne.</div>
        </div>
        <div class="f4">
          <label>Total disponible</label>
          <input readonly id="mhTotal" value="${fmtNum(total, 0)}" />
        </div>
        <div class="f12"><label>Notas</label><textarea name="notes" placeholder="Ej: listos para sacrificio, lote A…"></textarea></div>
      </form>`,
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="ok">Guardar</button>`,
            onMount: () => {
              const man = $("#mhForm [name=manual]");
              const tot = $("#mhTotal");
              const recalc = () => {
                const v = Math.max(0, num(man?.value));
                if (tot) tot.value = fmtNum(auto + v, 0);
              };
              if (man) {
                man.addEventListener("input", recalc);
                bindQtyInputs();
              }
              $("#ok").onclick = () => {
                const fd = new FormData($("#mhForm"));
                const mval = Math.max(0, num(fd.get("manual")));
                state.meat = state.meat || {
                  stockKg: 0,
                  headsForSale: 0,
                  headsManual: 0,
                  movements: [],
                };
                state.meat.headsManual = mval;
                // headsForSale se recalcula en auditState()
                save();
                dlg.close();
                toast(
                  "ok",
                  "Guardado",
                  `Total: ${fmtNum(auto + mval, 0)} cerdos`,
                );
                render();
              };
            },
          });
        }

        function openMeatStock() {
          const cur = num(state.meat?.stockKg);
          openModal({
            title: "Ajustar stock de carne (kg)",
            sub: "Control del inventario de carne por kilos.",
            body: `<form id="msForm" class="grid2">
        <div class="f4"><label>Tipo</label>
          <select name="type" id="mst">
            <option value="entrada">Entrada (+)</option>
            <option value="salida">Salida (-)</option>
            <option value="ajuste">Ajuste (fijar)</option>
          </select>
        </div>
        <div class="f4"><label>Stock actual</label><input readonly value="${fmtNum(cur, 2)} kg"/></div>
        <div class="f4"><label>Kilos (kg) *</label><input name="kg" data-qty="1" value="${fmtNum(cur, 2)}"/></div>
        <div class="f12"><label>Motivo</label><input name="reason" placeholder="Ej: sacrificio, merma, conteo…"/></div>
      </form>`,
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="ok">Aplicar</button>`,
            onMount: () => {
              const sel = $("#mst");
              const kgI = $('input[name="kg"]');
              const sync = () => {
                const t = sel.value;
                if (t === "entrada" || t === "salida") kgI.value = "";
                if (t === "ajuste") kgI.value = fmtNum(cur);
              };
              sel.onchange = sync;
              sync();

              $("#ok").onclick = () => {
                const fd = new FormData($("#msForm"));
                const type = (fd.get("type") || "ajuste").toString();
                const kg = num(fd.get("kg"));
                if (kg <= 0 && type !== "ajuste") {
                  openAlert({
                    title: "Faltan datos",
                    message: "Ingresa los kilos para el movimiento.",
                    kind: "bad",
                  });
                  return;
                }
                state.meat = state.meat || {
                  stockKg: 0,
                  headsForSale: 0,
                  movements: [],
                };
                const before = num(state.meat.stockKg);
                let after = before;
                if (type === "entrada") after = before + kg;
                if (type === "salida") {
                  if (kg > before) {
                    openAlert({
                      title: "Excede el stock",
                      message: `Disponible: ${fmtNum(before, 2)} kg`,
                      kind: "bad",
                    });
                    return;
                  }
                  after = before - kg;
                }
                if (type === "ajuste") after = Math.max(0, kg);

                state.meat.stockKg = after;
                state.meat.movements = state.meat.movements || [];
                state.meat.movements.push({
                  id: uid("mkmov"),
                  date: today(),
                  type,
                  kg: type === "ajuste" ? after : kg,
                  before,
                  after,
                  reason: (fd.get("reason") || "").toString().trim(),
                });

                save();
                dlg.close();
                toast(
                  "ok",
                  "Stock actualizado",
                  `Ahora: ${fmtNum(after, 2)} kg`,
                );
                render();
              };
            },
          });
        }

        function openMeatSale(id) {
          if (!state.clients.length) {
            openAlert({
              title: "Faltan datos",
              message: "Primero crea un cliente.",
              kind: "bad",
            });
            return;
          }

          const ms = state.meatSales || [];
          let s = id ? ms.find((x) => x.id === id) : null;

          s = s || {
            id: uid("meat"),
            date: today(),
            clientId: "",
            qty: 0, // kg
            unitPrice: 0, // COP/kg
            total: 0,
            status: "credito",
            paidAmount: 0,
            dueDate: "",
            notes: "",
            deductStock: true,
          };

          const hasPays =
            !!id && (state.meatPayments || []).some((p) => p.saleId === id);
          s._lockPay = hasPays || num(s.paidAmount) > 0;

          openModal({
            title: id ? "Editar venta de carne" : "Nueva venta de carne (kg)",
            sub: `Stock actual: ${fmtNum(num(state.meat?.stockKg), 2)} kg`,
            body: meatSaleForm(s),
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="ok">Guardar</button>`,
            onMount: () => {
              const sq = $("#mkq"),
                su = $("#mku"),
                st = $("#mkt"),
                ss = $("#mks"),
                sp = $("#mkp");
              const ds = $("#mkds");
              const recalc = () => {
                const t = Math.max(0, num(sq.value) * num(su.value));
                setMoney(st, t);
                if (ss.value === "pagado") setMoney(sp, t);
                if (ss.value === "credito") setMoney(sp, 0);
                const p = num(sp.value);
                if (p > t) setMoney(sp, t);
              };
              sq.oninput = recalc;
              su.oninput = recalc;
              ss.onchange = recalc;
              sp.oninput = recalc;
              recalc();

              $("#ok").onclick = () => saveMeatSale(id, ds?.checked);
            },
          });
        }

        function meatSaleForm(s) {
          const clientOps = state.clients
            .slice()
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
            .map(
              (c) =>
                `<option value="${c.id}" ${s.clientId === c.id ? "selected" : ""}>${esc(c.name)}</option>`,
            )
            .join("");

          return `<form id="meatSaleForm" class="grid2">
      <input type="hidden" name="id" value="${esc(s.id)}"/>
      <div class="f4"><label>Fecha *</label><input type="date" name="date" required value="${esc(s.date)}"/></div>
      <div class="f8"><label>Cliente *</label><select name="clientId" required><option value="">Selecciona</option>${clientOps}</select></div>

      <div class="f4"><label>Kilos (kg) *</label><input id="mkq" name="qty" data-qty="1" step="0.01" required value="${fmtNum(num(s.qty), 2)}"/></div>
      <div class="f4"><label>Precio por kg (COP) *</label><input id="mku" name="unitPrice" data-money="1" required value="${fmtNum(num(s.unitPrice), 0)}"/></div>
      <div class="f4"><label>Total (auto)</label><input id="mkt" name="total" data-money="1" readonly value="${fmtNum(num(s.total), 0)}"/></div>

      <div class="f4"><label>Estado</label>
        <select name="status" id="mks" ${s._lockPay ? "disabled" : ""}>
          ${["pagado", "parcial", "credito"].map((x) => `<option value="${x}" ${s.status === x ? "selected" : ""}>${x}</option>`).join("")}
        </select>
      </div>
      <div class="f4"><label>Pagado hoy (COP)</label><input id="mkp" name="paidAmount" data-money="1" ${s._lockPay ? "disabled" : ""} value="${fmtNum(num(s.paidAmount), 0)}"/></div>
      <div class="f4"><label>Vence</label><input type="date" name="dueDate" value="${esc(s.dueDate || "")}"/></div>

      ${s._lockPay ? `<div class="f12"><span class="tag info">Esta venta ya tiene abonos. Para registrar más pagos usa el botón <b>Abonar</b>.</span></div>` : ""}

      <div class="f12">
        <label class="row">
          <input type="checkbox" id="mkds" ${s.deductStock !== false ? "checked" : ""}/>
          <span>Descontar del stock de carne (kg)</span>
        </label>
        <div class="muted" style="margin-top:6px">Si no llevas stock en kg, puedes desmarcarlo.</div>
      </div>

      <div class="f12"><label>Notas</label><textarea name="notes">${esc(s.notes || "")}</textarea></div>
    </form>`;
        }

        function saveMeatSale(editId, deductStock = true) {
          const fd = new FormData($("#meatSaleForm"));
          const id = editId || (fd.get("id") || uid("meat")).toString();
          const date = (fd.get("date") || "").toString();
          const clientId = (fd.get("clientId") || "").toString();
          const qty = num(fd.get("qty")); // kg
          const unitPrice = num(fd.get("unitPrice")); // COP/kg
          const total = Math.max(0, qty * unitPrice);
          let status = (fd.get("status") || "credito").toString();
          let paid = num(fd.get("paidAmount"));
          const dueDate = (fd.get("dueDate") || "").toString();
          const notes = (fd.get("notes") || "").toString().trim();

          if (!date || !clientId || qty <= 0 || unitPrice < 0) {
            openAlert({
              title: "Faltan datos",
              message:
                "Debes seleccionar fecha, cliente, kilos y precio por kg.",
              kind: "bad",
            });
            return;
          }

          state.meat = state.meat || {
            stockKg: 0,
            headsForSale: 0,
            movements: [],
          };
          state.meatSales = state.meatSales || [];
          state.meatPayments = state.meatPayments || [];
          state.transactions = state.transactions || [];
          state.tasks = state.tasks || [];

          const existing =
            (state.meatSales || []).find((x) => x.id === id) || null;
          const hasPays = (state.meatPayments || []).some(
            (p) => p.saleId === id,
          );

          // Si ya tiene pagos registrados, no permitimos editar paid/status desde el formulario
          if (existing && hasPays) {
            paid = num(existing.paidAmount);
            status = existing.status || status;
          } else {
            if (paid > total) paid = total;
            // Ajuste de estado coherente
            if (status === "pagado") paid = total;
            if (status === "credito") paid = 0;
            if (status === "parcial" && paid <= 0)
              paid = Math.min(total, Math.max(0, paid));
            if (paid >= total) status = "pagado";
            else if (paid > 0) status = "parcial";
            else status = status === "parcial" ? "credito" : status;
          }

          // --- Stock: revertir venta anterior si estaba descontando stock ---
          const stockNow = num(state.meat.stockKg);
          let stockTemp = stockNow;

          if (existing && existing.deductStock) {
            stockTemp = stockTemp + num(existing.qty);
            state.meat.movements.push({
              id: uid("mkmov"),
              date: today(),
              type: "entrada",
              kg: num(existing.qty),
              before: stockNow,
              after: stockTemp,
              reason: `Reversión (edición) venta carne ${id.slice(-6)}`,
            });
          }

          // Aplicar nueva deducción si corresponde
          if (deductStock) {
            if (qty > stockTemp) {
              openAlert({
                title: "Stock insuficiente",
                message: `Disponible: ${fmtNum(stockTemp, 2)} kg. Ajusta el stock o desmarca “Descontar stock”.`,
                kind: "bad",
              });
              // revertimos cualquier movimiento temporal? (no guardado todavía, pero ya agregamos log) — limpiarlo:
              if (existing && existing.deductStock) state.meat.movements.pop();
              return;
            }
            const before = stockTemp;
            stockTemp = Math.max(0, stockTemp - qty);
            state.meat.movements.push({
              id: uid("mkmov"),
              date,
              type: "salida",
              kg: qty,
              before,
              after: stockTemp,
              reason: `Venta carne (${get.client(clientId)?.name || clientId})`,
            });
          }

          state.meat.stockKg = stockTemp;

          // --- Guardar/actualizar venta ---
          const payload = {
            id,
            date,
            clientId,
            qty,
            unitPrice,
            total,
            status,
            paidAmount: paid,
            dueDate,
            notes,
            deductStock,
          };

          const idx = state.meatSales.findIndex((x) => x.id === id);
          if (idx >= 0) state.meatSales[idx] = payload;
          else state.meatSales.push(payload);

          // --- Finanzas: ingreso inicial (solo si NO hay pagos previos) ---
          // Si existía y no tenía pagos, actualizamos el "ingreso inicial" eliminando el anterior
          state.transactions = state.transactions.filter(
            (tx) =>
              !(
                tx.refType === "meatSale" &&
                tx.refId === id &&
                String(tx.notes || "").startsWith("Venta carne")
              ),
          );
          if (!hasPays && paid > 0) {
            state.transactions.push({
              id: uid("tx"),
              date,
              type: "ingreso",
              category: "Ventas / carne (kg)",
              amount: paid,
              method: "",
              refType: "meatSale",
              refId: id,
              notes: `Venta carne (${fmtNum(qty, 2)} kg)`,
            });
          }

          // --- Tarea de cobro si queda pendiente ---
          const pending = Math.max(0, total - paid);
          state.tasks = state.tasks.filter(
            (t) => !(t.relatedType === "meatSale" && t.relatedId === id),
          );
          if (pending > 0) {
            state.tasks.push({
              id: uid("task"),
              title: `Cobro pendiente carne (${id.slice(-6)})`,
              dueDate: dueDate || addDays(date, 7),
              priority: "media",
              done: false,
              relatedType: "meatSale",
              relatedId: id,
              notes: `Pendiente: ${fmtCOP(pending)} • Cliente: ${get.client(clientId)?.name || ""}`,
            });
          }

          save();
          dlg.close();
          toast(
            "ok",
            "Venta guardada",
            pending > 0 ? `Pendiente: ${fmtCOP(pending)}` : "Pagada",
          );
          render();
        }

        function delMeatSale(id) {
          const s = get.meatSale(id);
          if (!s) return;
          openModal({
            title: "Eliminar venta de carne",
            sub: `${s.id.slice(-6)} • ${fmtCOP(num(s.total))}`,
            body: `<div class="muted">Se eliminará la venta y se revertirá (si aplica) el stock descontado, los abonos/ingresos y la tarea de cobro.</div>`,
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn danger" id="ok">Eliminar</button>`,
            onMount: () => {
              $("#ok").onclick = () => {
                // Revertir stock si la venta descontó stock
                state.meat = state.meat || {
                  stockKg: 0,
                  headsForSale: 0,
                  movements: [],
                };
                const before = num(state.meat.stockKg);
                if (s.deductStock) {
                  state.meat.stockKg = before + num(s.qty);
                  state.meat.movements = state.meat.movements || [];
                  state.meat.movements.push({
                    id: uid("mkmov"),
                    date: today(),
                    type: "entrada",
                    kg: num(s.qty),
                    before,
                    after: num(state.meat.stockKg),
                    reason: `Reversión (eliminar) venta carne ${s.id.slice(-6)}`,
                  });
                }

                // Eliminar venta
                state.meatSales = (state.meatSales || []).filter(
                  (x) => x.id !== id,
                );

                // Eliminar pagos y transacciones asociadas
                state.meatPayments = (state.meatPayments || []).filter(
                  (p) => p.saleId !== id,
                );
                state.transactions = (state.transactions || []).filter(
                  (tx) => !(tx.refType === "meatSale" && tx.refId === id),
                );

                // Eliminar tarea asociada
                state.tasks = (state.tasks || []).filter(
                  (t) => !(t.relatedType === "meatSale" && t.relatedId === id),
                );

                save();
                dlg.close();
                toast(
                  "ok",
                  "Eliminado",
                  "Venta y registros asociados eliminados.",
                );
                render();
              };
            },
          });
        }

        function openMeatPayment(saleId) {
          const s = get.meatSale(saleId);
          if (!s) return;
          const total = num(s.total);
          const paid0 = num(s.paidAmount);
          let pending = Math.max(0, total - paid0);
          if (pending <= 0) {
            toast("ok", "Sin saldo", "La venta ya está pagada.");
            return;
          }

          const pays = (state.meatPayments || [])
            .filter((p) => p.saleId === saleId)
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
          const pct0 =
            total > 0 ? Math.min(100, Math.round((paid0 / total) * 100)) : 0;

          openModal({
            title: "Registrar abono (carne)",
            sub: `Venta ${saleId.slice(-6)} • Pendiente: ${fmtCOP(pending)}`,
            body: `
        <div class="payTop">
          <div class="paySummary">
            <div class="payKpi"><div class="muted">Total</div><b>${fmtCOP(total)}</b></div>
            <div class="payKpi"><div class="muted">Abonado</div><b class="mono" id="payNowPaid">${fmtCOP(paid0)}</b></div>
            <div class="payKpi"><div class="muted">Pendiente</div><b class="mono" id="payNowPend">${fmtCOP(pending)}</b></div>
          </div>
          <div class="prog" title="Progreso de cobro"><div class="bar" id="payProgBar" style="width:${pct0}%"></div></div>
          <div class="muted" style="margin-top:8px">Progreso: <b id="payPct">${pct0}%</b></div>
        </div>

        <form id="payForm" class="grid2" style="margin-top:12px">
          <div class="f4"><label>Fecha</label><input type="date" name="date" value="${today()}"/></div>
          <div class="f4"><label>Método</label>
            <select name="method">
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="nequi">Nequi/Daviplata</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div class="f12">
            <label>Valor a abonar (COP) *</label>
            <input type="text" id="payAmount" name="amount" data-money="1" value="${fmtNum(Math.min(pending, total))}"/>
            <input type="range" id="payRange" min="0" max="${Math.max(1, Math.floor(pending))}" step="1" value="${Math.min(pending, total)}"/>
            <div class="chips">
              <button class="btn chip" type="button" data-set="25">25%</button>
              <button class="btn chip" type="button" data-set="50">50%</button>
              <button class="btn chip" type="button" data-set="all">Todo</button>
              <span class="muted" id="payClamp" style="display:none;margin-left:auto">Se ajustó al pendiente.</span>
            </div>
            <div class="helpLine">
              Después de este abono: <b class="mono" id="payAfterPaid">${fmtCOP(Math.min(total, paid0 + Math.min(pending, total)))}</b>
              • Pendiente: <b class="mono" id="payAfterPend">${fmtCOP(Math.max(0, total - (paid0 + Math.min(pending, total))))}</b>
            </div>
          </div>

          <div class="f12"><label>Notas</label><textarea name="notes" placeholder="Referencia, observación…"></textarea></div>
        </form>

        <div class="helpCard" style="margin-top:12px">
          <div class="helpHd">
            <div><b>Últimos abonos</b><div class="muted">Historial (reciente)</div></div>
            <span class="tag info">${pays.length}</span>
          </div>
          <div class="wrap"><table>
            <thead><tr><th>Fecha</th><th>Método</th><th>Valor</th><th>Notas</th></tr></thead>
            <tbody>
              ${
                pays
                  .slice(0, 6)
                  .map(
                    (p) =>
                      `<tr><td class="mono">${esc(p.date || "—")}</td><td>${esc(p.method || "—")}</td><td class="mono">${fmtCOP(p.amount)}</td><td>${esc(p.notes || "")}</td></tr>`,
                  )
                  .join("") ||
                `<tr><td colspan="4" class="muted">Sin abonos aún.</td></tr>`
              }
            </tbody>
          </table></div>
        </div>
      `,
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="ok">Registrar abono</button>`,
            onMount: () => {
              const amount = $("#payAmount");
              const range = $("#payRange");
              const pct = $("#payPct");
              const bar = $("#payProgBar");
              const clamp = $("#payClamp");
              const nowPaid = $("#payNowPaid");
              const nowPend = $("#payNowPend");
              const afterPaid = $("#payAfterPaid");
              const afterPend = $("#payAfterPend");

              const sync = (src) => {
                pending = Math.max(0, num(s.total) - num(s.paidAmount));
                const maxv = Math.max(0, Math.floor(pending));
                range.max = String(Math.max(1, maxv || 1));

                let v = num(amount.value);
                if (src === "range") v = num(range.value);

                const wasOver = v > pending;
                v = Math.max(0, Math.min(v, pending));

                amount.value = moneyFormatStr(v);
                range.value = String(Math.min(v, maxv));

                clamp.style.display = wasOver ? "inline" : "none";

                const paid1 = Math.min(total, paid0 + v);
                const pend1 = Math.max(0, total - paid1);

                nowPaid.textContent = fmtCOP(paid0);
                nowPend.textContent = fmtCOP(pending);
                afterPaid.textContent = fmtCOP(paid1);
                afterPend.textContent = fmtCOP(pend1);

                const pct1 =
                  total > 0
                    ? Math.min(100, Math.round((paid1 / total) * 100))
                    : 0;
                pct.textContent = pct1 + "%";
                bar.style.width = pct1 + "%";
              };

              amount.oninput = () => sync("amount");
              range.oninput = () => sync("range");
              $$(".chips button[data-set]").forEach(
                (b) =>
                  (b.onclick = () => {
                    const k = b.dataset.set;
                    let v = 0;
                    if (k === "25") v = pending * 0.25;
                    if (k === "50") v = pending * 0.5;
                    if (k === "all") v = pending;
                    amount.value = moneyFormatStr(v);
                    sync("amount");
                  }),
              );

              sync("amount");

              $("#ok").onclick = () => {
                const fd = new FormData($("#payForm"));
                const date = (fd.get("date") || today()).toString();
                const method = (fd.get("method") || "efectivo").toString();
                let amountV = num(fd.get("amount"));
                if (amountV <= 0) {
                  openAlert({
                    title: "Valor inválido",
                    message: "El abono debe ser mayor a 0.",
                    kind: "bad",
                  });
                  return;
                }

                const pendNow = Math.max(0, num(s.total) - num(s.paidAmount));
                amountV = Math.min(amountV, pendNow);
                if (amountV <= 0) {
                  openAlert({
                    title: "Sin saldo",
                    message: "No hay saldo pendiente para abonar.",
                    kind: "bad",
                  });
                  return;
                }

                s.paidAmount = num(s.paidAmount) + amountV;
                const newPending = Math.max(
                  0,
                  num(s.total) - num(s.paidAmount),
                );
                s.status = newPending <= 0 ? "pagado" : "parcial";

                state.meatPayments = state.meatPayments || [];
                state.meatPayments.push({
                  id: uid("mpay"),
                  saleId: s.id,
                  date,
                  amount: amountV,
                  method,
                  notes: (fd.get("notes") || "").toString().trim(),
                });
                state.transactions.push({
                  id: uid("tx"),
                  date,
                  type: "ingreso",
                  category: "Ventas / carne (kg)",
                  amount: amountV,
                  method,
                  refType: "meatSale",
                  refId: s.id,
                  notes: `Abono carne ${s.id.slice(-6)}`,
                });

                // cerrar tarea
                state.tasks = state.tasks || [];
                if (newPending <= 0) {
                  state.tasks = state.tasks.filter(
                    (t) =>
                      !(t.relatedType === "meatSale" && t.relatedId === s.id),
                  );
                }

                save();
                dlg.close();
                toast(
                  "ok",
                  "Abono registrado",
                  `Nuevo saldo: ${fmtCOP(newPending)}`,
                );
                render();
              };
            },
          });
        }

        // ------- Finanzas -------
        function renderFinance() {
          const m = today().slice(0, 7);
          const income = sumMonth("ingreso"),
            expense = sumMonth("gasto");
          const payOpen = (state.payables || []).filter(
            (p) => (p.status || "abierto") !== "cerrado",
          );
          const payPending = payOpen.reduce(
            (s, p) => s + Math.max(0, num(p.total) - num(p.paid)),
            0,
          );

          const rows = state.transactions
            .filter((t) =>
              matchQ(t.date, t.type, t.category, t.method, t.notes),
            )
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
            .map(
              (t) => `<tr>
        <td class="mono">${esc(t.date || "—")}</td>
        <td>${t.type === "ingreso" ? `<span class="tag ok">Ingreso</span>` : `<span class="tag bad">Gasto</span>`}</td>
        <td><b>${esc(t.category || "—")}</b><div class="muted">${esc(t.method || "")}</div></td>
        <td class="mono">${esc(fmtCOP(t.amount))}</td>
        <td class="muted">${esc(t.notes || "")}</td>
        <td><button class="btn danger" data-act="del" data-id="${t.id}">Eliminar</button></td>
      </tr>`,
            )
            .join("");

          const payRows = (state.payables || [])
            .filter((p) =>
              matchQ(
                p.date,
                p.supplier,
                p.itemName,
                p.notes,
                p.status,
                p.dueDate,
              ),
            )
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
            .map((p) => {
              const total = num(p.total),
                paid = num(p.paid);
              const rem = Math.max(0, total - paid);
              const st = p.status || "abierto";
              return `<tr>
          <td class="mono">${esc(p.date || "—")}</td>
          <td><b>${esc(p.itemName || "Compra")}</b><div class="muted">${esc(p.supplier || "")}</div></td>
          <td class="mono">${esc(fmtCOP(total))}</td>
          <td class="mono">${esc(fmtCOP(paid))}</td>
          <td class="mono">${esc(fmtCOP(rem))}</td>
          <td class="mono">${esc(p.dueDate || "—")}</td>
          <td>${st === "cerrado" ? `<span class="tag ok">Cerrado</span>` : `<span class="tag warn">Pendiente</span>`}</td>
          <td>${rem > 0 ? `<button class="btn primary" data-act="pay" data-id="${p.id}">Pagar</button>` : `<span class="muted">—</span>`}</td>
        </tr>`;
            })
            .join("");

          view.innerHTML = shell(
            "Finanzas",
            "Ingresos y gastos (ventas e inventario alimentan automáticamente).",
            `<button class="btn primary" id="inc">➕ Ingreso</button>
       <button class="btn" id="exp">➕ Gasto</button>
       <button class="btn" id="csv">Exportar CSV</button>`,
            `<div class="kpis" style="margin-bottom:12px">
        <div class="kpi" style="grid-column:span 4"><small>Ingresos (${m})</small><b>${fmtCOP(income)}</b><div class="muted mono">Ventas + abonos</div></div>
        <div class="kpi" style="grid-column:span 4"><small>Gastos (${m})</small><b>${fmtCOP(expense)}</b><div class="muted mono">Compras + manual</div></div>
        <div class="kpi" style="grid-column:span 4"><small>Resultado</small><b>${fmtCOP(income - expense)}</b><div class="muted mono">Ingreso - gasto</div></div>
      <div class="kpi" style="grid-column:span 4"><small>CxP pendientes</small><b class="mono">${esc(fmtCOP(payPending))}</b><div class="muted mono">Compras a crédito/parcial</div></div>
      </div>
      <div class="wrap"><table>
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Valor</th><th>Notas</th><th>Acción</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="6" class="muted">Sin transacciones.</td></tr>`}</tbody>
      </table></div>
<div class="wrap" style="margin-top:12px"><table>
  <thead><tr><th>Fecha</th><th>Compra</th><th>Total</th><th>Pagado</th><th>Pendiente</th><th>Vence</th><th>Estado</th><th>Acción</th></tr></thead>
  <tbody>${payRows || `<tr><td colspan="8" class="muted">Sin cuentas por pagar.</td></tr>`}</tbody>
</table></div>`,
          );

          $("#inc").onclick = () => openTx("ingreso");
          $("#exp").onclick = () => openTx("gasto");
          $("#csv").onclick = () => exportTxCSV();
          view.onclick = (e) => {
            const b = e.target.closest("button[data-act]");
            if (!b) return;
            if (b.dataset.act === "pay") {
              openPayablePay(b.dataset.id);
              return;
            }
            if (b.dataset.act === "del") {
              state.transactions = state.transactions.filter(
                (t) => t.id !== b.dataset.id,
              );
              save();
              toast("ok", "Eliminada", "Transacción eliminada.");
              render();
            }
          };
        }

        function txForm(type) {
          const t = {
            date: today(),
            type,
            category: type === "gasto" ? "Operación" : "Otros",
            amount: 0,
            method: "efectivo",
            notes: "",
          };
          return `<form id="txForm" class="grid2">
      <div class="f4"><label>Fecha</label><input type="date" name="date" value="${t.date}"/></div>
      <div class="f4"><label>Tipo</label><select name="type"><option value="ingreso" ${type === "ingreso" ? "selected" : ""}>Ingreso</option><option value="gasto" ${type === "gasto" ? "selected" : ""}>Gasto</option></select></div>
      <div class="f4"><label>Método</label><select name="method">${["efectivo", "transferencia", "nequi/daviplata", "tarjeta", "otro"].map((x) => `<option value="${x}">${x}</option>`).join("")}</select></div>
      <div class="f8"><label>Categoría</label><input name="category" value="${t.category}"/></div>
      <div class="f4"><label>Valor (COP)</label><input type="number" name="amount" min="0" value="0"/></div>
      <div class="f12"><label>Notas</label><textarea name="notes"></textarea></div>
    </form>
`;
        }

        function openTx(type) {
          openModal({
            title: type === "ingreso" ? "Nuevo ingreso" : "Nuevo gasto",
            sub: "Registro manual (aparte de lo automático).",
            body: txForm(type),
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="save">Guardar</button>`,
            onMount: () => {
              $("#save").onclick = () => {
                const fd = new FormData($("#txForm"));
                const date = (fd.get("date") || today()).toString();
                const tp = (fd.get("type") || type).toString();
                const amount = num(fd.get("amount"));
                if (amount <= 0) {
                  toast("bad", "Valor inválido", "Debe ser > 0.");
                  return;
                }
                state.transactions.push({
                  id: uid("tx"),
                  date,
                  type: tp,
                  category: (fd.get("category") || "").toString().trim() || "—",
                  amount,
                  method: (fd.get("method") || "efectivo").toString(),
                  refType: "manual",
                  refId: "",
                  notes: (fd.get("notes") || "").toString().trim(),
                });
                save();
                dlg.close();
                toast("ok", "Guardado", "Transacción registrada.");
                render();
              };
            },
          });
        }

        // ------- Cuentas por pagar (compras a crédito/parcial) -------
        function openPayablePay(pid) {
          const p = get.payable(pid);
          if (!p) return;
          const total = num(p.total);
          const paid0 = num(p.paid);
          let remain = Math.max(0, total - paid0);
          if (remain <= 0) {
            toast("ok", "Sin saldo", "Esta cuenta ya está pagada.");
            return;
          }

          const hist = (p.payments || [])
            .slice()
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
          const pct0 =
            total > 0 ? Math.min(100, Math.round((paid0 / total) * 100)) : 0;

          openModal({
            title: "Registrar pago",
            sub: `${p.itemName || "Compra"} • Pendiente: ${fmtCOP(remain)}`,
            body: `
        <div class="payTop">
          <div class="paySummary">
            <div class="payKpi"><div class="muted">Total</div><b>${fmtCOP(total)}</b></div>
            <div class="payKpi"><div class="muted">Pagado</div><b class="mono" id="cxpNowPaid">${fmtCOP(paid0)}</b></div>
            <div class="payKpi"><div class="muted">Pendiente</div><b class="mono" id="cxpNowPend">${fmtCOP(remain)}</b></div>
          </div>
          <div class="prog"><div class="bar" id="cxpBar" style="width:${pct0}%"></div></div>
          <div class="muted" style="margin-top:8px">Progreso: <b id="cxpPct">${pct0}%</b></div>
        </div>

        <form id="payF" class="grid2" style="margin-top:12px">
          <div class="f4"><label>Fecha</label><input type="date" name="date" value="${today()}"/></div>
          <div class="f4"><label>Método</label>
            <select name="method">
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div class="f12">
            <label>Valor a pagar (COP) *</label>
            <input type="number" id="cxpAmount" name="amount" min="0" step="1" value="${Math.min(remain, total)}"/>
            <input type="range" id="cxpRange" min="0" max="${Math.max(1, Math.floor(remain))}" step="1" value="${Math.min(remain, total)}"/>
            <div class="chips">
              <button class="btn chip" type="button" data-set="25">25%</button>
              <button class="btn chip" type="button" data-set="50">50%</button>
              <button class="btn chip" type="button" data-set="all">Todo</button>
              <span class="muted" id="cxpClamp" style="display:none;margin-left:auto">Se ajustó al pendiente.</span>
            </div>
            <div class="helpLine">
              Después de este pago: <b class="mono" id="cxpAfterPaid">${fmtCOP(Math.min(total, paid0 + Math.min(remain, total)))}</b>
              • Pendiente: <b class="mono" id="cxpAfterPend">${fmtCOP(Math.max(0, total - (paid0 + Math.min(remain, total))))}</b>
            </div>
          </div>

          <div class="f12"><label>Notas</label><textarea name="notes" placeholder="Referencia, observación…"></textarea></div>
        </form>

        <div class="helpCard" style="margin-top:12px">
          <div class="helpHd">
            <div><b>Historial de pagos</b><div class="muted">Esta cuenta</div></div>
            <span class="tag info">${hist.length}</span>
          </div>
          <div class="wrap"><table>
            <thead><tr><th>Fecha</th><th>Método</th><th>Valor</th><th>Notas</th></tr></thead>
            <tbody>
              ${
                hist
                  .slice(0, 6)
                  .map(
                    (x) =>
                      `<tr><td class="mono">${esc(x.date || "—")}</td><td>${esc(x.method || "—")}</td><td class="mono">${fmtCOP(x.amount)}</td><td>${esc(x.notes || "")}</td></tr>`,
                  )
                  .join("") ||
                `<tr><td colspan="4" class="muted">Sin pagos aún.</td></tr>`
              }
            </tbody>
          </table></div>
        </div>
      `,
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="ok">Registrar pago</button>`,
            onMount: () => {
              const amount = $("#cxpAmount");
              const range = $("#cxpRange");
              const pct = $("#cxpPct");
              const bar = $("#cxpBar");
              const clamp = $("#cxpClamp");
              const nowPaid = $("#cxpNowPaid");
              const nowPend = $("#cxpNowPend");
              const afterPaid = $("#cxpAfterPaid");
              const afterPend = $("#cxpAfterPend");

              const round100 = (x) => x;

              const sync = (src) => {
                remain = Math.max(0, num(p.total) - num(p.paid));
                const maxv = Math.max(0, Math.floor(remain));
                range.max = String(Math.max(1, maxv || 1));

                let v = num(amount.value);
                if (src === "range") v = num(range.value);

                const wasOver = v > remain;
                v = Math.max(0, Math.min(v, remain));
                v = round100(v);
                if (v > remain) v = remain;

                amount.value = moneyFormatStr(v);
                range.value = String(Math.min(v, maxv));
                // mantiene el input formateado
                amount.value = moneyFormatStr(v);

                clamp.style.display = wasOver ? "inline" : "none";

                const paid1 = Math.min(total, paid0 + v);
                const pend1 = Math.max(0, total - paid1);

                nowPaid.textContent = fmtCOP(paid0);
                nowPend.textContent = fmtCOP(remain);
                afterPaid.textContent = fmtCOP(paid1);
                afterPend.textContent = fmtCOP(pend1);

                const pct1 =
                  total > 0
                    ? Math.min(100, Math.round((paid1 / total) * 100))
                    : 0;
                pct.textContent = pct1 + "%";
                bar.style.width = pct1 + "%";
              };

              amount.oninput = () => sync("amount");
              range.oninput = () => sync("range");
              $$(".chips button[data-set]").forEach(
                (b) =>
                  (b.onclick = () => {
                    const k = b.dataset.set;
                    let v = 0;
                    if (k === "25") v = remain * 0.25;
                    if (k === "50") v = remain * 0.5;
                    if (k === "all") v = remain;
                    amount.value = moneyFormatStr(round100(v));
                    sync("amount");
                  }),
              );
              sync("amount");

              $("#ok").onclick = () => {
                const fd = new FormData($("#payF"));
                const date = (fd.get("date") || today()).toString();
                const method = (fd.get("method") || "efectivo").toString();
                let amountV = num(fd.get("amount"));
                if (amountV <= 0) {
                  openAlert({
                    title: "Valor inválido",
                    message: "El pago debe ser mayor a 0.",
                    kind: "bad",
                  });
                  return;
                }

                const remainNow = Math.max(0, num(p.total) - num(p.paid));
                amountV = Math.min(round100(amountV), remainNow);
                if (amountV <= 0) {
                  openAlert({
                    title: "Sin saldo",
                    message: "No hay saldo pendiente en esta cuenta.",
                    kind: "bad",
                  });
                  return;
                }

                // registra gasto
                state.transactions.push({
                  id: uid("tx"),
                  date,
                  type: "gasto",
                  category: p.category || "Inventario / compra",
                  amount: amountV,
                  method,
                  refType: "inventory",
                  refId: p.refId || "",
                  notes:
                    `Pago compra: ${p.itemName || "insumo"}${p.supplier ? " • " + p.supplier : ""}`.trim(),
                });

                // guarda historial interno de la CxP
                p.payments = p.payments || [];
                p.payments.push({
                  date,
                  amount: amountV,
                  method,
                  notes: (fd.get("notes") || "").toString().trim(),
                });

                // actualiza CxP
                p.paid = num(p.paid) + amountV;
                if (num(p.paid) >= num(p.total) - 0.0001) {
                  p.paid = num(p.total);
                  p.status = "cerrado";
                } else {
                  p.status = "abierto";
                }

                save();
                dlg.close();
                toast(
                  "ok",
                  "Pago registrado",
                  `Pendiente: ${fmtCOP(Math.max(0, num(p.total) - num(p.paid)))}`,
                );
                render();
              };
            },
          });
        }

        // ------- Tareas -------
        function renderTasks() {
          const now = today();
          const rows = state.tasks
            .filter((t) =>
              matchQ(t.title, t.dueDate, t.priority, t.status, t.notes),
            )
            .sort(
              (a, b) =>
                (a.status || "").localeCompare(b.status || "") ||
                (a.dueDate || "").localeCompare(b.dueDate || ""),
            )
            .map((t) => {
              const dueIn = t.dueDate ? daysBetween(now, t.dueDate) : null;
              const st = t.status || "pendiente";
              const tag =
                st === "hecha"
                  ? `<span class="tag ok">Hecha</span>`
                  : dueIn !== null && dueIn < 0
                    ? `<span class="tag bad">Vencida</span>`
                    : `<span class="tag warn">Pendiente</span>`;
              return `<tr>
          <td>${tag} <span class="tag">${esc(t.priority || "media")}</span></td>
          <td><b>${esc(t.title)}</b><div class="muted">${esc(t.notes || "")}</div></td>
          <td class="mono">${esc(t.dueDate || "—")}<div class="muted">${dueIn !== null ? (dueIn >= 0 ? `${dueIn} días` : `${Math.abs(dueIn)} días tarde`) : ""}</div></td>
          <td class="mono">${esc(t.relatedType || "—")} ${t.relatedId ? esc(t.relatedId.slice(-6)) : ""}</td>
          <td>
            ${st !== "hecha" ? `<button class="btn" data-act="done" data-id="${t.id}">Hecha</button>` : `<button class="btn" data-act="undo" data-id="${t.id}">Reabrir</button>`}
            <button class="btn danger" data-act="del" data-id="${t.id}">Eliminar</button>
          </td>
        </tr>`;
            })
            .join("");

          view.innerHTML = shell(
            "Tareas",
            "Agenda destete, chequeos, vacunación y cobros (algunas se crean automáticamente).",
            `<button class="btn primary" id="add">➕ Nueva tarea</button>`,
            `<div class="wrap"><table>
        <thead><tr><th>Estado</th><th>Tarea</th><th>Vence</th><th>Relacionado</th><th>Acciones</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5" class="muted">Sin tareas.</td></tr>`}</tbody>
      </table></div>`,
          );
          $("#add").onclick = () => openTask();
          view.onclick = (e) => {
            const b = e.target.closest("button[data-act]");
            if (!b) return;
            const id = b.dataset.id,
              act = b.dataset.act;
            if (act === "del") {
              state.tasks = state.tasks.filter((t) => t.id !== id);
              save();
              toast("ok", "Eliminada", "Tarea eliminada.");
              render();
            }
            if (act === "done" || act === "undo") {
              const t = state.tasks.find((x) => x.id === id);
              if (!t) return;
              t.status = act === "done" ? "hecha" : "pendiente";
              save();
              toast(
                "ok",
                "Listo",
                act === "done" ? "Marcada como hecha." : "Reabierta.",
              );
              render();
            }
          };
        }

        function taskForm(t) {
          t = t || {
            title: "",
            dueDate: addDays(today(), 3),
            priority: "media",
            status: "pendiente",
            relatedType: "",
            relatedId: "",
            notes: "",
          };
          return `<form id="taskForm" class="grid2">
      <div class="f12"><label>Título *</label><input name="title" required value="${esc(t.title)}" placeholder="Ej: Vacunar camada lote..." /></div>
      <div class="f4"><label>Fecha</label><input type="date" name="dueDate" value="${esc(t.dueDate)}"/></div>
      <div class="f4"><label>Prioridad</label><select name="priority">${["alta", "media", "baja"].map((x) => `<option ${t.priority === x ? "selected" : ""} value="${x}">${x}</option>`).join("")}</select></div>
      <div class="f4"><label>Estado</label><select name="status"><option value="pendiente" ${t.status !== "hecha" ? "selected" : ""}>Pendiente</option><option value="hecha" ${t.status === "hecha" ? "selected" : ""}>Hecha</option></select></div>
      <div class="f6"><label>Relacionado</label><select name="relatedType" id="rt">
        <option value="">—</option><option value="sow">Cerda</option><option value="batch">Camada</option><option value="sale">Venta</option><option value="inventory">Insumo</option>
      </select></div>
      <div class="f6"><label>Seleccionar</label><select name="relatedId" id="rid" disabled><option value="">—</option></select></div>
      <div class="f12"><label>Notas</label><textarea name="notes">${esc(t.notes)}</textarea></div>
    </form>
`;
        }

        function openTask() {
          openModal({
            title: "Nueva tarea",
            sub: "Puedes relacionarla con cerda/camada/venta/inventario.",
            body: taskForm(),
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="save">Guardar</button>`,
            onMount: () => {
              const rt = $("#rt"),
                rid = $("#rid");
              rt.onchange = () => {
                rid.innerHTML = `<option value="">—</option>`;
                if (!rt.value) {
                  rid.disabled = true;
                  return;
                }
                rid.disabled = false;
                if (rt.value === "sow")
                  rid.innerHTML += state.sows
                    .map(
                      (s) =>
                        `<option value="${s.id}">${esc(s.tag || s.name || "—")}</option>`,
                    )
                    .join("");
                if (rt.value === "batch")
                  rid.innerHTML += state.batches
                    .map(
                      (b) =>
                        `<option value="${b.id}">${esc(b.id.slice(-8))} • ${esc(get.sow(b.sowId)?.tag || "cerda")}</option>`,
                    )
                    .join("");
                if (rt.value === "sale")
                  rid.innerHTML += state.sales
                    .map(
                      (s) =>
                        `<option value="${s.id}">${esc(s.id.slice(-6))} • ${esc(get.client(s.clientId)?.name || "cliente")}</option>`,
                    )
                    .join("");
                if (rt.value === "inventory")
                  rid.innerHTML += state.inventory
                    .map(
                      (i) => `<option value="${i.id}">${esc(i.name)}</option>`,
                    )
                    .join("");
              };
              $("#save").onclick = () => {
                const fd = new FormData($("#taskForm"));
                const title = (fd.get("title") || "").toString().trim();
                if (!title) {
                  toast("bad", "Falta título", "Obligatorio.");
                  return;
                }
                state.tasks.push({
                  id: uid("tsk"),
                  title,
                  dueDate: (fd.get("dueDate") || "").toString(),
                  priority: (fd.get("priority") || "media").toString(),
                  status: (fd.get("status") || "pendiente").toString(),
                  relatedType: (fd.get("relatedType") || "").toString(),
                  relatedId: (fd.get("relatedId") || "").toString(),
                  notes: (fd.get("notes") || "").toString().trim(),
                });
                save();
                dlg.close();
                toast("ok", "Guardado", "Tarea creada.");
                render();
              };
            },
          });
        }

        // ------- Ajustes / Backup / CSV -------
        function renderSettings() {
          view.innerHTML = shell(
            "Ajustes",
            "Nombre de granja, días de gestación, respaldo JSON y exportaciones CSV.",
            `<button class="btn" id="reset">🧨 Reset</button>`,
            `<form id="setForm" class="grid2">
        <div class="f6"><label>Nombre granja</label><input name="farmName" value="${esc(state.settings.farmName || "")}"/></div>
        <div class="f3"><label>Moneda</label><select name="currency"><option value="COP" ${state.settings.currency === "COP" ? "selected" : ""}>COP</option><option value="USD" ${state.settings.currency === "USD" ? "selected" : ""}>USD</option></select></div>
        <div class="f3"><label>Días gestación</label><input type="number" name="gestationDays" min="90" max="130" value="${esc(state.settings.gestationDays || 115)}"/></div>
      </form>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
        <button class="btn primary" id="save">Guardar</button>
        <button class="btn" id="expJson">Exportar JSON</button>
        <label class="btn" style="cursor:pointer">Importar JSON <input id="imp" type="file" accept="application/json" style="display:none"/></label>
        <button class="btn" id="csvSales">CSV Ventas</button>
        <button class="btn" id="csvInv">CSV Inventario</button>
        <button class="btn" id="csvTx">CSV Finanzas</button>
      </div>
      <div class="muted" style="margin-top:10px;font-size:12px">Tip: exporta JSON semanal para respaldo.</div>`,
          );

          $("#save").onclick = () => {
            const fd = new FormData($("#setForm"));
            state.settings.farmName =
              (fd.get("farmName") || "Granja Porcícola Campo Bello")
                .toString()
                .trim() || "Granja Porcícola Campo Bello";
            state.settings.currency = (fd.get("currency") || "COP").toString();
            state.settings.gestationDays = num(fd.get("gestationDays")) || 115;
            save();
            toast("ok", "Guardado", "Ajustes actualizados.");
            render();
          };
          $("#expJson").onclick = exportJSON;
          $("#imp").onchange = importJSON;
          $("#csvSales").onclick = exportSalesCSV;
          $("#csvInv").onclick = exportInvCSV;
          $("#csvTx").onclick = exportTxCSV;
          $("#reset").onclick = resetAll;
        }

        function download(name, content, mime) {
          const blob = new Blob([content], { type: mime || "text/plain" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = name;
          a.click();
          URL.revokeObjectURL(a.href);
        }
        function exportJSON() {
          download(
            `granja_respaldo_${today()}.json`,
            JSON.stringify(state, null, 2),
            "application/json",
          );
          toast("ok", "Exportado", "Respaldo descargado.");
        }
        function importJSON(e) {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          const r = new FileReader();
          r.onload = () => {
            try {
              state = Object.assign(defaults(), JSON.parse(r.result));
              save();
              toast("ok", "Importado", "Base restaurada.");
              current = "dashboard";
              renderNav();
              render();
            } catch {
              toast("bad", "Error", "JSON inválido.");
            }
          };
          r.readAsText(file);
        }
        function resetAll() {
          openModal({
            title: "Reset total",
            sub: "Borra todo lo guardado en este navegador.",
            body: `<div class="tag bad">Recomendado: Exporta JSON antes.</div>`,
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn danger" id="ok">Borrar todo</button>`,
            onMount: () => {
              $("#ok").onclick = () => {
                state = defaults();
                save();
                dlg.close();
                toast("ok", "Listo", "Datos borrados.");
                current = "dashboard";
                renderNav();
                render();
              };
            },
          });
        }

        function toCSV(rows) {
          return rows
            .map((r) =>
              r
                .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
                .join(","),
            )
            .join("\n");
        }

        function exportSalesCSV() {
          const rows = [
            [
              "date",
              "client",
              "batch",
              "qty",
              "unitPrice",
              "total",
              "status",
              "paidAmount",
              "pending",
              "dueDate",
              "notes",
            ],
          ];
          state.sales.forEach((s) => {
            const c = get.client(s.clientId);
            const pending = Math.max(0, num(s.total) - num(s.paidAmount));
            rows.push([
              s.date,
              c?.name || "",
              s.batchId ? s.batchId.slice(-8) : "",
              s.qty,
              s.unitPrice,
              s.total,
              s.status,
              s.paidAmount,
              pending,
              s.dueDate,
              s.notes,
            ]);
          });
          download(`ventas_${today()}.csv`, toCSV(rows), "text/csv");
          toast("ok", "Exportado", "CSV de ventas descargado.");
        }
        function exportInvCSV() {
          const rows = [
            [
              "name",
              "category",
              "qty",
              "unit",
              "minQty",
              "unitCost",
              "supplier",
              "expiration",
              "notes",
            ],
          ];
          state.inventory.forEach((i) =>
            rows.push([
              i.name,
              i.category,
              i.qty,
              i.unit,
              i.minQty,
              i.unitCost,
              i.supplier,
              i.expiration,
              i.notes,
            ]),
          );
          download(`inventario_${today()}.csv`, toCSV(rows), "text/csv");
          toast("ok", "Exportado", "CSV de inventario descargado.");
        }
        function exportTxCSV() {
          const rows = [
            ["date", "type", "category", "amount", "method", "notes"],
          ];
          state.transactions.forEach((t) =>
            rows.push([
              t.date,
              t.type,
              t.category,
              t.amount,
              t.method,
              t.notes,
            ]),
          );
          download(`finanzas_${today()}.csv`, toCSV(rows), "text/csv");
          toast("ok", "Exportado", "CSV de finanzas descargado.");
        }

        // ------- Quick add + top buttons -------
        $("#quick").onclick = () => {
          openModal({
            title: "Registro rápido",
            sub: "Crea un registro sin cambiar de módulo.",
            body: `<div class="grid2">
        <div class="f12">
          <label>Tipo</label>
          <select id="qa">
            <option value="sow">Nueva cerda</option>
            <option value="breeding">Servicio / inseminación</option>
            <option value="farrowing">Parto</option>
            <option value="inv">Nuevo insumo</option>
            <option value="expense">Gasto</option>
            <option value="task">Tarea</option>
          </select>
        </div>
      </div>
      <div id="qaBody" style="margin-top:10px"></div>`,
            footer: `<button class="btn" id="mClose">Cancelar</button><button class="btn primary" id="go">Continuar</button>`,
            onMount: () => {
              const qa = $("#qa"),
                qaBody = $("#qaBody");
              const renderQA = () => {
                if (qa.value === "sow") qaBody.innerHTML = sowForm();
                if (qa.value === "breeding") qaBody.innerHTML = breedingForm();
                if (qa.value === "farrowing")
                  qaBody.innerHTML = farrowingForm();
                if (qa.value === "inv") qaBody.innerHTML = invForm();
                if (qa.value === "expense") qaBody.innerHTML = txForm("gasto");
                if (qa.value === "task") qaBody.innerHTML = taskForm();
              };
              qa.onchange = renderQA;
              renderQA();
              $("#go").onclick = () => {
                if (qa.value === "sow") saveSow();
                else if (qa.value === "breeding") saveBreeding();
                else if (qa.value === "farrowing") saveFarrowing();
                else if (qa.value === "inv") {
                  openInvItem();
                  toast(
                    "warn",
                    "Tip",
                    "Guarda el insumo desde el formulario para evitar duplicados.",
                  );
                } else if (qa.value === "expense") {
                  const fd = new FormData($("#txForm"));
                  const amount = num(fd.get("amount"));
                  if (amount <= 0) {
                    toast("bad", "Valor inválido", "Debe ser >0.");
                    return;
                  }
                  state.transactions.push({
                    id: uid("tx"),
                    date: (fd.get("date") || today()).toString(),
                    type: "gasto",
                    category: (fd.get("category") || "Operación").toString(),
                    amount,
                    method: (fd.get("method") || "efectivo").toString(),
                    refType: "manual",
                    refId: "",
                    notes: (fd.get("notes") || "").toString(),
                  });
                  save();
                  dlg.close();
                  toast("ok", "Guardado", "Gasto registrado.");
                  render();
                } else if (qa.value === "task") {
                  const fd = new FormData($("#taskForm"));
                  const title = (fd.get("title") || "").toString().trim();
                  if (!title) {
                    toast("bad", "Falta título", "Obligatorio.");
                    return;
                  }
                  state.tasks.push({
                    id: uid("tsk"),
                    title,
                    dueDate: (fd.get("dueDate") || "").toString(),
                    priority: (fd.get("priority") || "media").toString(),
                    status: (fd.get("status") || "pendiente").toString(),
                    relatedType: (fd.get("relatedType") || "").toString(),
                    relatedId: (fd.get("relatedId") || "").toString(),
                    notes: (fd.get("notes") || "").toString().trim(),
                  });
                  save();
                  dlg.close();
                  toast("ok", "Guardado", "Tarea creada.");
                  render();
                }
              };
            },
          });
        };

        $("#newSale").onclick = () => openSale();
        const hb = $("#helpBtn");
        if (hb) hb.onclick = () => openHelp();

        // ------- Init -------
        renderNav();
        setupAuth();
        const __lb = $("#logoutBtn");
        if (__lb) __lb.onclick = openLogout;
        if (isAuthed()) lockUI(false);
        if (window.__refreshLoginBrand) window.__refreshLoginBrand();
        render();
        save(); // ensures pills update
        setTimeout(() => maybeOnboard(), 80);
      })();
