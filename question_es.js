const GLOBAL_ROUTES = {
  // Entrada principal
  ENTRY: {
    "EXTRAVÍO/PÉRDIDA": "EXTRAVIO",
    "SUSTRACCIÓN": "SUSTRACCION_SELECTOR",
    "DAÑOS": "DANOS",
    "ESTAFA / ESTAFA INFORMÁTICA": "ESTAFA",
    "AGRESIÓN": "AGRESION_SELECTOR",
    "AMENAZAS": "AMENAZAS_GLOBAL",
    "OTRO TIPO DE HECHO": "OTRO_TIPO_HECHO"
  },

  // Entrada secundaria (segunda página de categorías)
  PAGE2: {
    "ALLANAMIENTO / USURPACIÓN": "ALLANAMIENTO_USURPACION",
    "APROPIACIÓN INDEBIDA": "APROPIACION_INDEBIDA",
    "COACCIONES": "COACCIONES",
    "CARÁCTER SEXUAL": "CARACTER_SEXUAL",
    "DENUNCIA GENÉRICA": "OTROS"
  },

  // Sustracción
  SUSTRACCION_SELECTOR: {
    "A LA PERSONA": "HURTO_RVI",
    "EN COMERCIO (HORARIO LABORAL)": "PATRIMONIO",
    "EN DOMICILIO / ESTABLECIMIENTO": "ROBO_FUERZA"
  },

  // Agresión
  AGRESION_SELECTOR: {
    "ENTORNO FAMILIAR / AFECTIVO": "AGRESION_FAMILIAR_AFECTIVO",
    "OTRO (NO FAMILIAR)": "LESIONES"
  }
};
const QUESTION_SETS = {

  "EXPORT_KEY_MAP": {
    "caracteristica_hecho": "hecho_caracteristicas",
    "caracteristica_hecho_p2": "hecho_caracteristicas_secundarias",

    "sustraccion_donde": "sustraccion_donde",

    "calidad_denunciante": "denunciante_calidad",
    "conocimiento_hecho": "hecho_conocimiento",

    "fhl": "hecho_fecha_hora_lugar",
    "fecha": "hecho_fecha",
    "hora": "hecho_hora",
    "hora_desde": "hecho_hora_desde",
    "hora_hasta": "hecho_hora_hasta",
    "lugar": "hecho_lugar",

    "interaccion_autor": "autor_interaccion",
    "tipo_intimidacion": "autor_intimidacion_tipo",

    "lesiones": "lesiones_presenta",
    "tiene_lesiones": "lesiones_presenta",
    "descripcion_lesiones": "lesiones_descripcion",
    "parte_medico": "lesiones_parte_medico",
    "informe_medico": "lesiones_informe_medico",

    "descripcion_danos": "danos_descripcion",
    "danos": "danos_hay",
    "danos_descripcion": "danos_descripcion",
    "presupuesto_reparacion": "danos_aporta_presupuesto",
    "danos_valoracion": "danos_valoracion_eur",

    "metodo_acceso": "acceso_metodo",
    "ha_manipulado_lugar": "hecho_manipulacion_lugar",

    "sustraccion": "sustraccion_hay",
    "objetos": "sustraccion_objetos",

    "camaras": "camaras_hay",
    "camaras_detalle": "camaras_gestion_detalle",

    "autor_retenido": "autor_retenido_en_lugar",

    "conoce_autor": "autor_conocido",
    "datos_autor": "autor_datos",
    "descripcion_autor": "autor_descripcion",
    "descripcion_autores": "autores_descripcion",

    "resumen": "hecho_resumen",

    "agresion_tipo": "agresion_tipo",
    "objetos_extraviados": "extravio_objetos",
    "tipo_amenaza": "amenazas_tipologia",
    "tipo_amenaza_otro": "amenazas_tipologia_otro",
    "metodo_sustraccion": "sustraccion_metodo",
    "metodo_sustraccion_otro": "sustraccion_metodo_otro",
    "tipo_intimidacion": "autor_intimidacion_tipo",
    "tipo_establecimiento": "hecho_establecimiento_tipo",
    "zona_objetivo": "hecho_zona_objetivo",
    "metodo_acceso": "acceso_metodo",
    "metodo_acceso_otro": "acceso_metodo_otro",
    "danos_tipo": "danos_tipologia",
    "danos_tipo_otro": "danos_tipologia_otro",
    "numero_serie_imei": "objeto_numero_serie_imei",
    "autores": "autores",
    "subtipo_estafa": "estafa_subtipo",
    "canal_contacto": "estafa_canal_contacto",
    "instrumento_pago": "estafa_instrumento_pago",
    "importe_total_eur": "estafa_importe_total_eur",
    "n_operaciones": "estafa_numero_operaciones",
    "entidad_bancaria": "estafa_entidad_bancaria",
    "identificadores_estafa": "estafa_identificadores",
    "evidencias_estafa": "estafa_evidencias",
    "tipo_coaccion": "coacciones_tipo",
    "ambito_coaccion": "coacciones_ambito",
    "medio_coaccion": "coacciones_medio",
    "reiteracion_coaccion": "coacciones_reiteracion",
    "n_eventos_aprox": "coacciones_numero_eventos_aprox",
    "perjuicio_coaccion": "coacciones_perjuicio",
    "subtipo_allanamiento": "allanamiento_subtipo",
    "inmueble_tipo": "allanamiento_inmueble_tipo",
    "situacion_actual": "allanamiento_situacion_actual",
    "subtipo_apropiacion": "apropiacion_subtipo",
    "origen_tenencia": "apropiacion_origen_tenencia",
    "requerimiento_devolucion": "apropiacion_requerimiento_devolucion",
    "fecha_requerimiento": "apropiacion_fecha_requerimiento",
    "medio_requerimiento": "apropiacion_medio_requerimiento",
    "respuesta_requerido": "apropiacion_respuesta_requerido",
    "importe_estimado_eur": "apropiacion_importe_estimado_eur",

    "condicion": "declarante_condicion",
    "tipo_afectividad": "afectividad_tipo",
    "hay_convivencia": "convivencia_hay",
    "es_pareja_actual": "pareja_es_actual",
    "tiempo_relacion": "pareja_tiempo_relacion",

    "vinculo_autor": "autor_vinculo",
    "quien_es": "autor_nombre_relacion",
    "relacion_autor": "autor_relacion_detalle",

    "vg_p9":  "vg_agresion_fisica_previa",
    "vg_p10": "vg_insultos_humillacion_amenazas",
    "vg_p11": "vg_control_telefono_redes_amistades",
    "vg_p12": "vg_impide_trabajar_estudiar_relacionarse",
    "vg_p13": "vg_obliga_relaciones_sexuales",
    "vg_p14": "vg_destruye_objetos_o_amenaza",
    "vg_p15": "vg_amenaza_muerte",
    "vg_p16": "vg_amenaza_suicidio_si_deja",
    "vg_p17": "vg_acceso_armas_objetos_peligrosos",
    "vg_p18": "vg_consumo_alcohol_drogas_habitual",
    "vg_p18_det": "vg_consumo_detalle",
    "vg_p19": "vg_mas_violento_con_consumo",
    "vg_p20": "vg_aumento_frecuencia_gravedad",
    "vg_p21": "vg_comienzo_violencia",
    "vg_p22": "vg_intento_separacion_previo",
    "vg_p23": "vg_que_ocurrio_tras_intento",
    "vg_p24": "vg_menores_presencian",
    "vg_p25": "vg_agresion_amenaza_a_menores",
    "vg_p26": "vg_menores_en_peligro",
    "vg_p27": "vg_denuncias_previas",
    "vg_p28": "vg_orden_proteccion_tuvo",
    "vg_p28b": "vg_orden_proteccion_sobre_autor",
    "vg_p28_solicita": "vg_solicita_orden_proteccion",
    "vg_p29": "vg_atencion_servicios_sociales_sanitarios",
    "vg_p30a": "vg_entorno_conoce_situacion",
    "vg_p30b": "vg_dependencia_economica",
    "vg_p31": "vg_puede_empeorar",
    "vg_p32": "vg_miedo_real_vida",

    "vd_menores": "vd_menores_presencian",
    "vd_domicilio": "vd_en_domicilio_familiar",
    "vd_anteriores": "vd_anteriores_similares"
  },

  "GLOBAL": [
    {
      key: "caracteristica_hecho",
      title: "CARACTERÍSTICAS DEL HECHO",
      type: "select",
      options: [
        "EXTRAVÍO/PÉRDIDA",
        "SUSTRACCIÓN",
        "DAÑOS",
        "ESTAFA / ESTAFA INFORMÁTICA",
        "AGRESIÓN",
        "AMENAZAS",
        "ALLANAMIENTO / USURPACIÓN",
        "APROPIACIÓN INDEBIDA",
        "COACCIONES",
        "CARÁCTER SEXUAL",
        "DENUNCIA GENÉRICA"
      ]
    }
  ],

  "OTRO_TIPO_HECHO": [
    {
      key: "caracteristica_hecho_p2",
      title: "OTROS TIPOS DE HECHO",
      type: "select",
      options: [
        "ALLANAMIENTO / USURPACIÓN",
        "APROPIACIÓN INDEBIDA",
        "COACCIONES",
        "CARÁCTER SEXUAL",
        "DENUNCIA GENÉRICA"
      ]
    }
  ],

  // =============================
  // SUSTRACCIÓN: selector (persona / comercio / inmueble)
  // =============================
  "SUSTRACCION_SELECTOR": [
    {
      key: "sustraccion_donde",
      title: "¿DÓNDE SE PRODUCE LA SUSTRACCIÓN?",
      type: "select",
      options: [
        "A LA PERSONA",
        "EN COMERCIO (HORARIO LABORAL)",
        "EN DOMICILIO / ESTABLECIMIENTO"
      ]
    }
  ],

  // =============================
  // TRANSCRIPCIÓN EXACTA DE TUS ARCHIVOS (SIN TOCAR)
  // =============================

  // hurto_rvi.html
  "HURTO_RVI": [
    {
      key: "calidad_denunciante",
      title: "DENUNCIA EN CALIDAD DE...",
      type: "select",
      options: ["PERJUDICADO", "TESTIGO"]
    },

    {
      key: "fhl",
      title: "FECHA, HORA Y LUGAR DEL HECHO",
      type: "fhl",
      horaHastaOpcional: true,
      placeholderLugar: "Calle / establecimiento / municipio"
    },

    {
      key: "interaccion_autor",
      title: "¿INTERACCIÓN CON EL AUTOR?",
      type: "select",
      options: [
        "NO",
        "SI, COMUNICACION / ACERCAMIENTO",
        "SI, FORCEJEO O AGRESION",
        "SI, INTIMIDACION SIN CONTACTO"
      ],
      },

    {
      key: "lesiones",
      title: "¿PRESENTA LESIONES?",
      type: "select",
      options: ["NO", "SI"],
      when: (st) =>
        st.calidad_denunciante === "PERJUDICADO" &&
        st.interaccion_autor === "SI, FORCEJEO O AGRESION"
    },

    {
      key: "descripcion_lesiones",
      title: "DESCRIBA BREVEMENTE LAS LESIONES",
      type: "text",
      when: (st) =>
        st.calidad_denunciante === "PERJUDICADO" &&
        st.interaccion_autor === "SI, FORCEJEO O AGRESION" &&
        st.lesiones === "SI"
    },

    {
      key: "parte_medico",
      title: "¿APORTA PARTE MÉDICO?",
      type: "select",
      options: ["NO", "SI"],
      when: (st) =>
        st.calidad_denunciante === "PERJUDICADO" &&
        st.interaccion_autor === "SI, FORCEJEO O AGRESION" &&
        st.lesiones === "SI"
    },

    {
      key: "tipo_intimidacion",
      title: "TIPO DE INTIMIDACIÓN",
      type: "text",
      when: (st) =>
        st.interaccion_autor === "SI, INTIMIDACION SIN CONTACTO"
    },

    {
      key: "objetos",
      title: "OBJETOS SUSTRAÍDOS",
      type: "objects",
      when: (st) =>
        st.calidad_denunciante === "PERJUDICADO"
    },

    {
      key: "autores",
      title: "DESCRIPCIÓN FÍSICA DEL AUTOR/ES",
      type: "authors"
    },

    {
      key: "resumen",
      title: "RESUMEN DE LOS HECHOS",
      type: "textarea",
      max: 900
    },
  ],

  // denunciante_patrimonio.html
  "PATRIMONIO": [
    { key:"calidad_denunciante", title:"DENUNCIA EN CALIDAD DE...", type:"select", options:[
      "PERJUDICADO",
      "REPRESENTANTE LEGAL",
      "EMPLEADO DE COMERCIO AFECTADO"
    ]},
    { key:"conocimiento_hecho", title:"¿COMO TIENE CONOCIMIENTO DEL HECHO?", type:"select", options:[
      "TESTIGO DIRECTO",
      "POR TERCERAS PERSONAS",
      "CAMARAS DE SEGURIDAD",
      "TRAS COMPROBAR PROPIEDAD FALTANTE"
    ]},
    { key:"fhl", title:"FECHA, HORA Y LUGAR DEL HECHO", type:"fhl", horaHastaOpcional:true, placeholderLugar:"Calle / establecimiento / municipio" },
    { key:"metodo_sustraccion", title:"MÉTODO DE SUSTRACCIÓN", type:"select", options:[
      "DESCUIDO",
      "ARREBATO",
      "BOLSILLO",
      "OCULTACIÓN DE OBJETO",
      "OTRO"
    ]},
    { key:"metodo_sustraccion_otro", title:"ESPECIFIQUE OTRO MÉTODO DE SUSTRACCIÓN", type:"text",
      when:(st)=> (st.metodo_sustraccion === "OTRO")
    },
    { key:"interaccion_autor", title:"¿INTERACCION CON EL AUTOR?", type:"select", options:[
      "NO",
      "SI, COMUNICACION",
      "SI, FORCEJEO O AGRESION",
      "SI, INTIMIDACION SIN CONTACTO"
    ]},
    { key:"lesiones", title:"¿PRESENTA LESIONES?", type:"select", options:["NO","SI"],
      when:(st)=> (st.interaccion_autor === "SI, FORCEJEO O AGRESION")
    },
    { key:"parte_medico", title:"¿APORTA INFORME MEDICO?", type:"select", options:["NO","SI"],
      when:(st)=> (st.interaccion_autor === "SI, FORCEJEO O AGRESION" && st.lesiones === "SI")
    },
    { key:"tipo_intimidacion", title:"TIPO DE INTIMIDACIÓN", type:"text",
      when:(st)=> (st.interaccion_autor === "SI, INTIMIDACION SIN CONTACTO")
    },
    { key:"autor_retenido", title:"¿AUTOR RETENIDO EN EL LUGAR?", type:"select", options:["SI","NO"] },
    { key:"camaras", title:"¿HAY CAMARAS DE SEGURIDAD?", type:"select", options:[
      "NO",
      "SI, LAS APORTA EN ESTE ACTO",
      "SI, LAS APORTARÁ EN SEDE JUDICIAL",
      "SI, FACILITA CONTACTO PARA SU GESTION"
    ]},
    { key:"camaras_detalle", title:"GESTION DE GRABACIONES", type:"text", placeholder:"Establecimiento, contacto, ubicación, horario...",
      when:(st)=> (st.camaras === "SI, FACILITA CONTACTO PARA SU GESTION")
    },
    { key:"tipo_establecimiento", title:"TIPO DE ESTABLECIMIENTO", type:"select", options:[
      "SUPERMERCADO",
      "FARMACIA",
      "HOSTELERÍA",
      "TIENDA ROPA / COMPLEMENTOS",
      "ESTANCO / LOTERÍA",
      "OTRO"
    ]},
    { key:"tipo_establecimiento_otro", title:"ESPECIFIQUE OTRO TIPO DE ESTABLECIMIENTO", type:"text",
      when:(st)=> (st.tipo_establecimiento === "OTRO")
    },
    { key:"zona_objetivo", title:"ZONA DEL ESTABLECIMIENTO", type:"select", options:[
      "LÍNEA DE CAJA",
      "MOSTRADOR",
      "ALMACÉN",
      "PROBADORES",
      "TERRAZA / EXTERIOR",
      "OTRA"
    ]},
    { key:"zona_objetivo_otra", title:"ESPECIFIQUE OTRA ZONA DEL ESTABLECIMIENTO", type:"text",
      when:(st)=> (st.zona_objetivo === "OTRA")
    },
    { key:"objetos", title:"OBJETOS SUSTRAIDOS", type:"objects" },
    { key:"resumen", title:"BREVE RESUMEN DE LOS HECHOS", type:"textarea", max:900 }
  ],

  // robo_fuerza.html
  "ROBO_FUERZA": [
    { key:"calidad_denunciante", title:"DENUNCIA EN CALIDAD DE...", type:"select", options:[
      "PERJUDICADO",
      "TESTIGO"
    ]},

    // Solo si NO es testigo: cómo tiene conocimiento (si es testigo se entiende que lo vio)
    { key:"conocimiento_hecho", title:"¿CÓMO TIENE CONOCIMIENTO DEL HECHO?", type:"select", options:[
      "A TRAVÉS DE LA POLICÍA",
      "EMPRESA DE SEGURIDAD",
      "POR TERCERAS PERSONAS",
      "DESCUBRIMIENTO POSTERIOR AL HECHO",
      "TESTIGO DE LOS HECHOS"
    ],
      when:(st)=> (st.calidad_denunciante === "PERJUDICADO")
    },

    { key:"fhl", title:"FECHA, INTERVALO HORARIO Y LUGAR DEL HECHO", type:"fhl", horaHastaOpcional:true, placeholderLugar:"Domicilio / establecimiento / municipio", interval:true },

    { key:"metodo_acceso", title:"MÉTODO DE ACCESO", type:"select", options:[
      "ESCALO",
      "FRACTURA CERRADURA",
      "FORZAMIENTO PUERTA",
      "FORZAMIENTO VENTANA",
      "LLAVE FALSA / LLAVE SUSTRAÍDA",
      "INHIBIDOR / SISTEMA ELECTRÓNICO",
      "OTRO"
    ]},
    { key:"metodo_acceso_otro", title:"ESPECIFIQUE OTRO MÉTODO DE ACCESO", type:"text",
      when:(st)=> (st.metodo_acceso === "OTRO")
    },

    // PERJUDICADO: daños y presupuesto
    { key:"danos", title:"¿SE PRODUJERON DAÑOS?", type:"select", options:["NO","SI"],
      when:(st)=> (st.calidad_denunciante === "PERJUDICADO")
    },
    { key:"presupuesto_reparacion", title:"¿APORTA PRESUPUESTO DE REPARACIÓN?", type:"select", options:["NO","SI"],
      when:(st)=> (st.calidad_denunciante === "PERJUDICADO" && st.danos === "SI")
    },
    { key:"danos_descripcion", title:"DESCRIPCIÓN DE LOS DAÑOS", type:"text", placeholder:"Describe brevemente los daños producidos...",
      when:(st)=> (st.calidad_denunciante === "PERJUDICADO" && st.danos === "SI")
    },
    { key:"danos_tipo", title:"TIPO DE DAÑOS", type:"select", options:[
      "CERRADURA",
      "PUERTA",
      "VENTANA",
      "PERSIANA",
      "CRISTAL",
      "MOBILIARIO",
      "VEHÍCULO",
      "OTRO"
    ],
      when:(st)=> (st.calidad_denunciante === "PERJUDICADO" && st.danos === "SI")
    },
    { key:"danos_tipo_otro", title:"ESPECIFIQUE OTRO TIPO DE DAÑO", type:"text",
      when:(st)=> (st.calidad_denunciante === "PERJUDICADO" && st.danos === "SI" && st.danos_tipo === "OTRO")
    },
    { key:"danos_valoracion", title:"VALORACIÓN / PRESUPUESTO DE REPARACIÓN", type:"text", placeholder:"Importe, empresa, nº presupuesto, fecha...",
      when:(st)=> (st.calidad_denunciante === "PERJUDICADO" && st.danos === "SI" && st.presupuesto_reparacion === "SI")
    },

    // PERJUDICADO: manipulación del lugar
    { key:"ha_manipulado_lugar", title:"¿HA MANIPULADO EL LUGAR DE LOS HECHOS? (PARA CONOCIMIENTO DE LA BRIGADA DE POLICÍA CIENTÍFICA)", type:"select", options:["NO","SI"],
      when:(st)=> (st.calidad_denunciante === "PERJUDICADO")
    },

    // PERJUDICADO: sustracción y objetos solo si SI
    { key:"sustraccion", title:"¿SE HA PRODUCIDO SUSTRACCIÓN?", type:"select", options:["NO","SI"],
      when:(st)=> (st.calidad_denunciante === "PERJUDICADO")
    },
    { key:"objetos", title:"OBJETOS SUSTRAÍDOS", type:"objects",
      when:(st)=> (st.calidad_denunciante === "PERJUDICADO" && st.sustraccion === "SI")
    },

    // PERJUDICADO: cámaras de seguridad
    { key:"camaras", title:"¿HAY CAMARAS DE SEGURIDAD?", type:"select", options:[
      "NO",
      "SI, LAS APORTA EN ESTE ACTO",
      "SI, LAS APORTARÁ EN SEDE JUDICIAL",
      "SI, FACILITA CONTACTO PARA SU GESTION"
    ],
      when:(st)=> (st.calidad_denunciante === "PERJUDICADO")
    },
    { key:"camaras_detalle", title:"GESTION DE GRABACIONES", type:"text", placeholder:"Establecimiento, contacto, ubicación, horario...",
      when:(st)=> (st.calidad_denunciante === "PERJUDICADO" && st.camaras === "SI, FACILITA CONTACTO PARA SU GESTION")
    },

    // Autores: siempre para TESTIGO y también si el PERJUDICADO fue testigo de los hechos
    { key:"autores", title:"BREVE DESCRIPCIÓN FÍSICA DE LOS AUTORES", type:"authors",
      when:(st)=> (st.calidad_denunciante === "TESTIGO" || (st.conocimiento_hecho === "TESTIGO DE LOS HECHOS"))
    },

    { key:"resumen", title:"BREVE RESUMEN DE LOS HECHOS", type:"textarea", max:900 }
  ],

  // danos.html
  "DANOS": [
    { key:"calidad_denunciante", title:"DENUNCIA EN CALIDAD DE...", type:"select", options:[
      "PERJUDICADO",
      "TESTIGO"
    ]},

    // Solo si NO es testigo: cómo tiene conocimiento (si es testigo se entiende que lo vio)
    { key:"conocimiento_hecho", title:"¿CÓMO TIENE CONOCIMIENTO DEL HECHO?", type:"select", options:[
      "A TRAVÉS DE LA POLICÍA",
      "POR TERCERAS PERSONAS",
      "DESCUBRIMIENTO POSTERIOR AL HECHO",
      "TESTIGO DE LOS HECHOS"
    ],
      when:(st)=> (st.calidad_denunciante !== "TESTIGO")
    },

    { key:"fhl", title:"FECHA, INTERVALO HORARIO Y LUGAR DEL HECHO", type:"fhl", horaHastaOpcional:true, placeholderLugar:"Domicilio / establecimiento / municipio", interval:true },

    // En DAÑOS es obvio que hay daños: pedimos descripción directamente (solo PERJUDICADO)
    { key:"descripcion_danos", title:"DESCRIPCIÓN DE LOS DAÑOS", type:"text", placeholder:"Describe brevemente los daños producidos...",
      when:(st)=> (st.calidad_denunciante === "PERJUDICADO")
    },
    { key:"danos_tipo", title:"TIPO DE DAÑOS", type:"select", options:[
      "CERRADURA",
      "PUERTA",
      "VENTANA",
      "PERSIANA",
      "CRISTAL",
      "MOBILIARIO",
      "VEHÍCULO",
      "OTRO"
    ],
      when:(st)=> (st.calidad_denunciante === "PERJUDICADO")
    },
    { key:"danos_tipo_otro", title:"ESPECIFIQUE OTRO TIPO DE DAÑO", type:"text",
      when:(st)=> (st.calidad_denunciante === "PERJUDICADO" && st.danos_tipo === "OTRO")
    },

    // Presupuesto y valoración (solo PERJUDICADO)
    { key:"presupuesto_reparacion", title:"¿APORTA PRESUPUESTO DE REPARACIÓN?", type:"select", options:["NO","SI"],
      when:(st)=> (st.calidad_denunciante === "PERJUDICADO")
    },
    { key:"danos_valoracion", title:"VALORACIÓN / PRESUPUESTO DE REPARACIÓN", type:"text", placeholder:"Importe, empresa, nº presupuesto, fecha...",
      when:(st)=> (st.calidad_denunciante === "PERJUDICADO" && st.presupuesto_reparacion === "SI")
    },

    // Autores: siempre para TESTIGO y también si el PERJUDICADO fue testigo de los hechos
    { key:"autores", title:"BREVE DESCRIPCIÓN FÍSICA DE LOS AUTORES", type:"authors",
      when:(st)=> (st.calidad_denunciante === "TESTIGO" || (st.conocimiento_hecho === "TESTIGO DE LOS HECHOS"))
    },

    { key:"resumen", title:"BREVE RESUMEN DE LOS HECHOS", type:"textarea", max:900 }
  ],

  // lesiones.html
  "LESIONES": [
    { key:"calidad_denunciante", title:"DENUNCIA EN CALIDAD DE...", type:"select", options:[
      "PERJUDICADO",
      "TESTIGO"
    ]},

    { key:"fhl", title:"FECHA, HORA Y LUGAR DEL HECHO", type:"fhl", horaHastaOpcional:true, placeholderLugar:"Calle / zona / municipio" },

    // Si es TESTIGO, NO puede valorar lesiones: se omite todo lo de lesiones/parte.
    { key:"lesiones", title:"¿PRESENTA LESIONES?", type:"select", options:["NO","SI"],
      when:(st)=> (st.calidad_denunciante !== "TESTIGO")
    },

    { key:"descripcion_lesiones", title:"DESCRIPCION DE LESIONES", type:"textarea", max:900,
      when:(st)=> (st.calidad_denunciante !== "TESTIGO" && st.lesiones === "SI")
    },

    { key:"parte_medico", title:"¿APORTA PARTE MEDICO?", type:"select", options:["NO","SI"],
      when:(st)=> (st.calidad_denunciante !== "TESTIGO" && st.lesiones === "SI")
    },

    // === Identificación del autor en agresión no familiar ===
    // PERJUDICADO: primero si conoce autor
   { key:"conoce_autor", title:"¿CONOCE AL AUTOR DE LOS HECHOS?", type:"select", options:["SI","NO"] },

{ key:"datos_autor", title:"APORTE DATOS", type:"text",
  when:(st)=> (st.conoce_autor === "SI")
},

{ key:"autores", title:"DESCRIPCIÓN DEL AUTOR/ES", type:"authors",
  when:(st)=> (st.conoce_autor === "NO" || !st.conoce_autor)
},

    { key:"resumen", title:"BREVE RESUMEN DE LOS HECHOS", type:"textarea", max:900 }
  ],

  // =============================
  // AGRESIÓN: selector
  // =============================
  "AGRESION_SELECTOR": [
    {
      key: "agresion_tipo",
      title: "TIPO DE AGRESIÓN",
      type: "select",
      options: [
        "ENTORNO FAMILIAR / AFECTIVO",
        "OTRO (NO FAMILIAR)"
      ]
    }
  ],

  // =============================
  // AGRESIÓN: familiar/afectivo (lo tuyo)
  // =============================
  "AGRESION_FAMILIAR_AFECTIVO": [
    { key:"condicion", title:"DENUNCIA EN CALIDAD DE...", type:"select", options:["VICTIMA","TESTIGO"] },

    { key:"tipo_afectividad", title:"TIPO DE AFECTIVIDAD", type:"select", options:[
      "AGRESIÓN DE PAREJA (HOMBRE A MUJER) - V. GÉNERO",
      "RESTO DE CASOS - V. DOMÉSTICA"
    ]},

    { key:"fhl", title:"FECHA, HORA Y LUGAR DEL HECHO", type:"fhl", horaHastaOpcional:true, placeholderLugar:"Calle / zona / municipio" },

    { key:"contexto_victima", title:"CONTEXTO DE LA VÍCTIMA", type:"group",
      when:(st)=> (st.condicion === "VICTIMA"),
      items:[
        { key:"hay_convivencia", title:"¿HAY CONVIVENCIA?", type:"select", options:["SI","NO"] },
        { key:"tiene_lesiones", title:"¿TIENE LESIONES?", type:"select", options:["SI","NO"] }
      ]
    },
    { key:"lesiones_victima", title:"LESIONES", type:"group",
      when:(st)=> (st.condicion === "VICTIMA" && st.tiene_lesiones === "SI"),
      items:[
        { key:"descripcion_lesiones", title:"DESCRIBA LAS LESIONES", type:"textarea", max:900, fullRow:true },
        { key:"informe_medico", title:"¿APORTA INFORME MEDICO?", type:"select", options:["SI","NO"] }
      ]
    },

    // SOLO V.GÉNERO (solo víctima)
    { key:"relacion_pareja_vg", title:"RELACIÓN CON EL AUTOR (V. GÉNERO)", type:"group",
      when:(st)=> (st.condicion === "VICTIMA" && st.tipo_afectividad === "AGRESIÓN DE PAREJA (HOMBRE A MUJER) - V. GÉNERO"),
      items:[
        { key:"es_pareja_actual", title:"¿ES SU PAREJA ACTUAL?", type:"select", options:["SI","NO"] },
        { key:"tiempo_relacion", title:"¿CUANTO TIEMPO DE RELACION?", type:"text", when:(st)=> (st.es_pareja_actual === "SI") }
      ]
    },
    { key:"vg_bloque_1", title:"INDICADORES DE RIESGO (I)", type:"group",
      when:(st)=> (st.condicion === "VICTIMA" && st.tipo_afectividad === "AGRESIÓN DE PAREJA (HOMBRE A MUJER) - V. GÉNERO"),
      items:[
        { key:"vg_p9", title:"¿Le ha agredido físicamente en otra ocasión?", type:"select", options:["SI","NO"] },
        { key:"vg_p10", title:"¿Le ha insultado, humillado o amenazado?", type:"select", options:["SI","NO"] },
        { key:"vg_p11", title:"¿Le controla el teléfono, redes sociales o amistades?", type:"select", options:["SI","NO"] },
        { key:"vg_p12", title:"¿Le impide trabajar, estudiar o relacionarse?", type:"select", options:["SI","NO"] },
        { key:"vg_p13", title:"¿Le obliga o ha obligado a mantener relaciones sexuales?", type:"select", options:["SI","NO"] },
        { key:"vg_p14", title:"¿Ha destruido objetos o amenazado con hacerlo?", type:"select", options:["SI","NO"] }
      ]
    },
    { key:"vg_bloque_2", title:"INDICADORES DE RIESGO (II)", type:"group",
      when:(st)=> (st.condicion === "VICTIMA" && st.tipo_afectividad === "AGRESIÓN DE PAREJA (HOMBRE A MUJER) - V. GÉNERO"),
      items:[
        { key:"vg_p15", title:"¿Le ha dicho que la va a matar?", type:"select", options:["SI","NO"] },
        { key:"vg_p16", title:"¿Ha amenazado con suicidarse si usted lo deja?", type:"select", options:["SI","NO"] },
        { key:"vg_p17", title:"¿Tiene acceso a armas, cuchillos u objetos peligrosos?", type:"select", options:["SI","NO"] },
        { key:"vg_p18", title:"¿Consume alcohol o drogas de forma habitual?", type:"select", options:["SI","NO"] },
        { key:"vg_p18_det", title:"Describe qué tipo de sustancias y habitualidad", type:"text", when:(st)=> (st.vg_p18 === "SI"), fullRow:true },
        { key:"vg_p19", title:"¿Se vuelve más violento cuando consume?", type:"select", options:["SI","NO"] },
        { key:"vg_p20", title:"¿Los episodios han aumentado en frecuencia o gravedad?", type:"select", options:["SI","NO"] }
      ]
    },
    { key:"vg_bloque_3", title:"ANTECEDENTES Y MENORES", type:"group",
      when:(st)=> (st.condicion === "VICTIMA" && st.tipo_afectividad === "AGRESIÓN DE PAREJA (HOMBRE A MUJER) - V. GÉNERO"),
      items:[
        { key:"vg_p21", title:"¿La violencia comenzó hace poco o lleva tiempo ocurriendo?", type:"text", fullRow:true },
        { key:"vg_p22", title:"¿Ha intentado usted separarse anteriormente?", type:"select", options:["SI","NO"] },
        { key:"vg_p23", title:"¿Qué ocurrió cuando lo intentó?", type:"text", when:(st)=> (st.vg_p22 === "SI"), fullRow:true },
        { key:"vg_p24", title:"¿Hay menores que presencien los hechos?", type:"select", options:["SI","NO"] },
        { key:"vg_p25", title:"¿Ha agredido o amenazado alguna vez a los menores?", type:"select", options:["SI","NO"], when:(st)=> (st.vg_p24 === "SI") },
        { key:"vg_p26", title:"¿Cree que los menores están en peligro?", type:"select", options:["SI","NO"], when:(st)=> (st.vg_p24 === "SI") }
      ]
    },
    { key:"vg_bloque_4", title:"PROTECCIÓN Y APOYO", type:"group",
      when:(st)=> (st.condicion === "VICTIMA" && st.tipo_afectividad === "AGRESIÓN DE PAREJA (HOMBRE A MUJER) - V. GÉNERO"),
      items:[
        { key:"vg_p27", title:"¿Ha denunciado anteriormente estos hechos?", type:"select", options:["SI","NO"] },
        { key:"vg_p28", title:"¿Tiene o ha tenido orden de protección?", type:"select", options:["SI","NO"] },
        { key:"vg_p28b", title:"¿Sobre el autor?", type:"select", options:["SI","NO"], when:(st)=> (st.vg_p28 === "SI") },
        { key:"vg_p28_solicita", title:"¿DESEA SOLICITAR ORDEN DE PROTECCIÓN?", type:"select", options:["SI","NO"], when:(st)=> (st.vg_p28 === "NO" || st.vg_p28 === "SI") },
        { key:"vg_p29", title:"¿Está siendo atendida por servicios sociales o sanitarios?", type:"select", options:["SI","NO"] },
        { key:"vg_p30a", title:"¿Alguna persona de su entorno conoce la situación?", type:"select", options:["SI","NO"] },
        { key:"vg_p30b", title:"¿Depende usted económicamente de él?", type:"select", options:["SI","NO"] },
        { key:"vg_p31", title:"¿Cree usted que la situación puede empeorar?", type:"select", options:["SI","NO"] },
        { key:"vg_p32", title:"¿Tiene miedo real por su vida?", type:"select", options:["SI","NO"] }
      ]
    },

    // V.DOMÉSTICA (solo víctima)
    { key:"vd_bloque", title:"VALORACIÓN V. DOMÉSTICA", type:"group",
      when:(st)=> (st.condicion === "VICTIMA" && st.tipo_afectividad === "RESTO DE CASOS - V. DOMÉSTICA"),
      items:[
        { key:"vd_menores", title:"¿HECHOS EN PRESENCIA DE MENORES?", type:"select", options:["SI","NO"] },
        { key:"vd_domicilio", title:"¿HECHOS EN DOMICILIO FAMILIAR?", type:"select", options:["SI","NO"] },
        { key:"vd_anteriores", title:"¿HECHOS ANTERIORES SIMILARES?", type:"select", options:["SI","NO"] }
      ]
    },

    // Cierre
    { key:"resumen", title:"BREVE RESUMEN DE LOS HECHOS", type:"textarea", max:900 }
  ],

  // =============================
  // AMENAZAS: BASE = archivo + TU CAMBIO (vincular a VG/VD si conoce autor)
  // =============================
  "AMENAZAS_GLOBAL": [
    // Base de amenazas.html (idéntico hasta conoce_autor)
    {
      key: "condicion",
      title: "DENUNCIA EN CALIDAD DE...",
      type: "select",
      options: ["PERJUDICADO", "TESTIGO"]
    },
    {
      key: "fhl",
      title: "FECHA, HORA Y LUGAR DEL HECHO",
      type: "fhl",
      placeholderLugar: "Calle / zona / municipio"
    },
    {
      key: "conoce_autor",
      title: "¿CONOCE AL AUTOR DE LOS HECHOS?",
      type: "select",
      options: ["NO", "SI"]
    },

    // TU CAMBIO: si conoce autor, preguntar tipo de vínculo para enganchar VG/VD sin “ir” a agresión
    {
      key: "vinculo_autor",
      title: "VÍNCULO CON EL AUTOR",
      type: "select",
      options: [
        "AUTOR VARÓN Y PAREJA (O SIMILAR AFECTIVIDAD EN EL PRESENTE O PASADO) - V. GÉNERO",
        "AUTOR/A DEL ENTORNO FAMILIAR - V. DOMÉSTICA",
        "OTRO"
      ],
      when: (st)=> (st.conoce_autor === "SI")
    },

    // Identificación (solo si conoce autor y elige “otro”)
    {
      key: "quien_es",
      title: "NOMBRE Y/O RELACIÓN QUE LE UNE",
      type: "text",
      when: (st)=> (st.conoce_autor === "SI" && st.vinculo_autor === "OTRO")
    },

    { key:"contexto_relacion_amenazas", title:"CONTEXTO DE RELACIÓN", type:"group",
      when:(st)=> (st.conoce_autor === "SI" && st.condicion === "PERJUDICADO" && (st.vinculo_autor === "AUTOR VARÓN Y PAREJA (O SIMILAR AFECTIVIDAD EN EL PRESENTE O PASADO) - V. GÉNERO" || st.vinculo_autor === "AUTOR/A DEL ENTORNO FAMILIAR - V. DOMÉSTICA")),
      items:[
        { key:"hay_convivencia", title:"¿HAY CONVIVENCIA?", type:"select", options:["SI","NO"] },
        { key:"relacion_autor", title:"RELACIÓN QUE LE UNE AL AUTOR/A", type:"text", fullRow:true }
      ]
    },
    { key:"vg_amenazas_bloque_1", title:"INDICADORES DE RIESGO (I)", type:"group",
      when:(st)=> (st.conoce_autor === "SI" && st.condicion === "PERJUDICADO" && st.vinculo_autor === "AUTOR VARÓN Y PAREJA (O SIMILAR AFECTIVIDAD EN EL PRESENTE O PASADO) - V. GÉNERO"),
      items:[
        { key:"vg_p9", title:"¿Le ha agredido físicamente en otra ocasión?", type:"select", options:["SI","NO"] },
        { key:"vg_p10", title:"¿Le ha insultado, humillado o amenazado?", type:"select", options:["SI","NO"] },
        { key:"vg_p11", title:"¿Le controla el teléfono, redes sociales o amistades?", type:"select", options:["SI","NO"] },
        { key:"vg_p12", title:"¿Le impide trabajar, estudiar o relacionarse?", type:"select", options:["SI","NO"] },
        { key:"vg_p13", title:"¿Le obliga o ha obligado a mantener relaciones sexuales?", type:"select", options:["SI","NO"] },
        { key:"vg_p14", title:"¿Ha destruido objetos o amenazado con hacerlo?", type:"select", options:["SI","NO"] }
      ]
    },
    { key:"vg_amenazas_bloque_2", title:"INDICADORES DE RIESGO (II)", type:"group",
      when:(st)=> (st.conoce_autor === "SI" && st.condicion === "PERJUDICADO" && st.vinculo_autor === "AUTOR VARÓN Y PAREJA (O SIMILAR AFECTIVIDAD EN EL PRESENTE O PASADO) - V. GÉNERO"),
      items:[
        { key:"vg_p15", title:"¿Le ha dicho que la va a matar?", type:"select", options:["SI","NO"] },
        { key:"vg_p16", title:"¿Ha amenazado con suicidarse si usted lo deja?", type:"select", options:["SI","NO"] },
        { key:"vg_p17", title:"¿Tiene acceso a armas, cuchillos u objetos peligrosos?", type:"select", options:["SI","NO"] },
        { key:"vg_p18", title:"¿Consume alcohol o drogas de forma habitual?", type:"select", options:["SI","NO"] },
        { key:"vg_p18_det", title:"Describe qué tipo de sustancias y habitualidad", type:"text", when:(st)=> (st.vg_p18 === "SI"), fullRow:true },
        { key:"vg_p19", title:"¿Se vuelve más violento cuando consume?", type:"select", options:["SI","NO"] },
        { key:"vg_p20", title:"¿Los episodios han aumentado en frecuencia o gravedad?", type:"select", options:["SI","NO"] }
      ]
    },
    { key:"vg_amenazas_bloque_3", title:"ANTECEDENTES Y MENORES", type:"group",
      when:(st)=> (st.conoce_autor === "SI" && st.condicion === "PERJUDICADO" && st.vinculo_autor === "AUTOR VARÓN Y PAREJA (O SIMILAR AFECTIVIDAD EN EL PRESENTE O PASADO) - V. GÉNERO"),
      items:[
        { key:"vg_p21", title:"¿La violencia comenzó hace poco o lleva tiempo ocurriendo?", type:"text", fullRow:true },
        { key:"vg_p22", title:"¿Ha intentado usted separarse anteriormente?", type:"select", options:["SI","NO"] },
        { key:"vg_p23", title:"¿Qué ocurrió cuando lo intentó?", type:"text", when:(st)=> (st.vg_p22 === "SI"), fullRow:true },
        { key:"vg_p24", title:"¿Hay menores que presencien los hechos?", type:"select", options:["SI","NO"] },
        { key:"vg_p25", title:"¿Ha agredido o amenazado alguna vez a los menores?", type:"select", options:["SI","NO"], when:(st)=> (st.vg_p24 === "SI") },
        { key:"vg_p26", title:"¿Cree que los menores están en peligro?", type:"select", options:["SI","NO"], when:(st)=> (st.vg_p24 === "SI") }
      ]
    },
    { key:"vg_amenazas_bloque_4", title:"PROTECCIÓN Y APOYO", type:"group",
      when:(st)=> (st.conoce_autor === "SI" && st.condicion === "PERJUDICADO" && st.vinculo_autor === "AUTOR VARÓN Y PAREJA (O SIMILAR AFECTIVIDAD EN EL PRESENTE O PASADO) - V. GÉNERO"),
      items:[
        { key:"vg_p27", title:"¿Ha denunciado anteriormente estos hechos?", type:"select", options:["SI","NO"] },
        { key:"vg_p28", title:"¿Tiene o ha tenido orden de protección?", type:"select", options:["SI","NO"] },
        { key:"vg_p28b", title:"¿Sobre el autor?", type:"select", options:["SI","NO"], when:(st)=> (st.vg_p28 === "SI") },
        { key:"vg_p28_solicita", title:"¿DESEA SOLICITAR ORDEN DE PROTECCIÓN?", type:"select", options:["SI","NO"], when:(st)=> (st.vg_p28 === "SI" || st.vg_p28 === "NO") },
        { key:"vg_p29", title:"¿Está siendo atendida por servicios sociales o sanitarios?", type:"select", options:["SI","NO"] },
        { key:"vg_p30a", title:"¿Alguna persona de su entorno conoce la situación?", type:"select", options:["SI","NO"] },
        { key:"vg_p30b", title:"¿Depende usted económicamente de él?", type:"select", options:["SI","NO"] },
        { key:"vg_p31", title:"¿Cree usted que la situación puede empeorar?", type:"select", options:["SI","NO"] },
        { key:"vg_p32", title:"¿Tiene miedo real por su vida?", type:"select", options:["SI","NO"] }
      ]
    },
    { key:"vd_amenazas_bloque", title:"VALORACIÓN V. DOMÉSTICA", type:"group",
      when:(st)=> (st.conoce_autor === "SI" && st.condicion === "PERJUDICADO" && st.vinculo_autor === "AUTOR/A DEL ENTORNO FAMILIAR - V. DOMÉSTICA"),
      items:[
        { key:"vd_menores", title:"¿HECHOS EN PRESENCIA DE MENORES?", type:"select", options:["SI","NO"] },
        { key:"vd_domicilio", title:"¿HECHOS EN DOMICILIO FAMILIAR?", type:"select", options:["SI","NO"] },
        { key:"vd_anteriores", title:"¿HECHOS ANTERIORES SIMILARES?", type:"select", options:["SI","NO"] }
      ]
    },

    // Continuación normal amenazas (archivo)
    {
      key: "tipo_amenaza",
      title: "TIPO DE AMENAZA",
      type: "select",
      options: [
        "AMENAZA",
        "AMENAZA DE LESIÓN",
        "AMENAZA DE DAÑOS EN BIENES",
        "AMENAZA A MENORES",
        "AMENAZA CONDICIONAL",
        "OTRA"
      ]
    },
    {
      key: "tipo_amenaza_otro",
      title: "ESPECIFIQUE OTRA AMENAZA",
      type: "text",
      when: (st)=> (st.tipo_amenaza === "OTRA")
    },
    {
      key: "autores",
      title: "DESCRIPCIÓN DEL AUTOR",
      type: "authors",
      when: (st)=> (st.conoce_autor === "NO")
    },
    {
      key: "resumen",
      title: "BREVE RESUMEN DE LOS HECHOS",
      type: "textarea",
      max: 900
    }
  ],

  // =============================
  // CARÁCTER SEXUAL (lo tuyo)
  // =============================
  "CARACTER_SEXUAL": [
    { key:"condicion", title:"DENUNCIA EN CALIDAD DE...", type:"select", options:["VICTIMA","TESTIGO"] },
    { key:"fhl", title:"FECHA, HORA Y LUGAR DEL HECHO", type:"fhl", horaHastaOpcional:true, placeholderLugar:"Calle / zona / municipio" },
    { key:"conoce_autor", title:"¿CONOCE AL AUTOR DE LOS HECHOS?", type:"select", options:["SI","NO"] },
    { key:"datos_autor", title:"AÑADA DATOS DEL AUTOR", type:"text",
      when:(st)=> (st.conoce_autor === "SI")
    },
    { key:"autores", title:"DESCRIPCIÓN DEL AUTOR", type:"authors",
      when:(st)=> (st.conoce_autor === "NO")
    },
    { key:"resumen", title:"BREVE RESUMEN DE LOS HECHOS", type:"textarea", max:900 }
  ],

  // =============================
  // EXTRAVÍO / PÉRDIDA
  // =============================
  "EXTRAVIO": [
    { key:"fhl", title:"FECHA, HORA Y LUGAR DEL EXTRAVÍO", type:"fhl", placeholderLugar:"Calle / zona / municipio" },
    { key:"objetos_extraviados", title:"OBJETOS EXTRAVIADOS", type:"objects", noValue:true },
    { key:"resumen", title:"CIRCUNSTANCIAS DEL EXTRAVÍO/PÉRDIDA", type:"textarea", max:900 }
  ],

  // =============================
  // ESTAFA / ESTAFA INFORMÁTICA
  // =============================
  "ESTAFA": [
    { key:"calidad_denunciante", title:"DENUNCIA EN CALIDAD DE...", type:"select", options:["PERJUDICADO","REPRESENTANTE LEGAL","TESTIGO"] },
    { key:"subtipo_estafa", title:"SUBTIPO DE ESTAFA", type:"select", options:["BANCARIA","BIZUM","TARJETA","PHISHING","COMPRA/VENTA","SUPLANTACIÓN","OTRA"] },
    { key:"subtipo_estafa_otra", title:"ESPECIFIQUE OTRO SUBTIPO DE ESTAFA", type:"text",
      when:(st)=> (st.subtipo_estafa === "OTRA")
    },
    { key:"fhl", title:"FECHA, HORA Y LUGAR/CANAL DEL HECHO", type:"fhl", horaHastaOpcional:true, placeholderLugar:"Web, app, teléfono, comercio, municipio..." },
    { key:"estafa_transaccion", title:"OPERATIVA ECONÓMICA", type:"group",
      items:[
        { key:"canal_contacto", title:"CANAL DE CONTACTO", type:"select", options:["TELÉFONO","SMS","EMAIL","WEB","APP","RRSS","MENSAJERÍA","OTRO"] },
        { key:"canal_contacto_otro", title:"ESPECIFIQUE OTRO CANAL DE CONTACTO", type:"text",
          when:(st)=> (st.canal_contacto === "OTRO")
        },
        { key:"instrumento_pago", title:"INSTRUMENTO DE PAGO", type:"select", options:["TRANSFERENCIA","TARJETA","BIZUM","EFECTIVO","CRIPTOMONEDA","OTRO"] },
        { key:"instrumento_pago_otro", title:"ESPECIFIQUE OTRO INSTRUMENTO DE PAGO", type:"text",
          when:(st)=> (st.instrumento_pago === "OTRO")
        },
        { key:"importe_total_eur", title:"IMPORTE TOTAL ESTIMADO (€)", type:"text", placeholder:"Ej.: 1250" },
        { key:"n_operaciones", title:"NÚMERO APROXIMADO DE OPERACIONES", type:"text", placeholder:"Ej.: 3" }
      ]
    },
    { key:"estafa_identificadores", title:"IDENTIFICADORES Y EVIDENCIAS", type:"group",
      items:[
        { key:"entidad_bancaria", title:"ENTIDAD BANCARIA (SI APLICA)", type:"text", placeholder:"Ej.: Banco X" },
        { key:"identificadores_estafa", title:"IDENTIFICADORES RELACIONADOS", type:"text", placeholder:"IBAN, teléfono, email, URL, usuario...", fullRow:true },
        { key:"evidencias_estafa", title:"EVIDENCIAS DISPONIBLES", type:"select", options:["CAPTURAS","JUSTIFICANTES","MENSAJES","AUDIOS","VARIAS","NINGUNA"], default:"NINGUNA" }
      ]
    },
    { key:"resumen", title:"RESUMEN DE LOS HECHOS", type:"textarea", max:900 },
  ],

  // =============================
  // COACCIONES
  // =============================
  "COACCIONES": [
    { key:"calidad_denunciante", title:"DENUNCIA EN CALIDAD DE...", type:"select", options:["PERJUDICADO","TESTIGO"] },
    { key:"tipo_coaccion", title:"TIPO DE COACCIÓN", type:"select", options:["IMPEDIR HACER ALGO","OBLIGAR A HACER ALGO","CONTROL DE MOVILIDAD","LABORAL","VECINAL","OTRA"] },
    { key:"tipo_coaccion_otra", title:"ESPECIFIQUE OTRA COACCIÓN", type:"text", when:(st)=> (st.tipo_coaccion === "OTRA") },
    { key:"fhl", title:"FECHA, HORA Y LUGAR DEL HECHO", type:"fhl", horaHastaOpcional:true, placeholderLugar:"Calle / domicilio / trabajo / municipio" },
    { key:"ambito_coaccion", title:"ÁMBITO", type:"select", options:["PAREJA","FAMILIAR","LABORAL","VECINAL","OTRO"] },
    { key:"ambito_coaccion_otro", title:"ESPECIFIQUE OTRO ÁMBITO", type:"text", when:(st)=> (st.ambito_coaccion === "OTRO") },
    { key:"medio_coaccion", title:"MEDIO UTILIZADO", type:"select", options:["PRESENCIAL","TELÉFONO","MENSAJERÍA","TERCEROS","OTRO"] },
    { key:"reiteracion_coaccion", title:"REITERACIÓN", type:"select", options:["HECHO ÚNICO","REITERADO"] },
    { key:"n_eventos_aprox", title:"NÚMERO APROXIMADO DE EVENTOS", type:"text", when:(st)=> (st.reiteracion_coaccion === "REITERADO") },
    { key:"perjuicio_coaccion", title:"PERJUICIO PRINCIPAL", type:"select", options:["PERSONAL","LABORAL","ECONÓMICO","FAMILIAR","OTRO"] },
    { key:"perjuicio_coaccion_otro", title:"ESPECIFIQUE OTRO PERJUICIO", type:"text", when:(st)=> (st.perjuicio_coaccion === "OTRO") },
    { key:"autores", title:"DESCRIPCIÓN DEL AUTOR/ES", type:"authors" },
    { key:"resumen", title:"RESUMEN DE LOS HECHOS", type:"textarea", max:900 },
  ],

  // =============================
  // ALLANAMIENTO / USURPACIÓN
  // =============================
  "ALLANAMIENTO_USURPACION": [
    { key:"calidad_denunciante", title:"DENUNCIA EN CALIDAD DE...", type:"select", options:["PERJUDICADO","REPRESENTANTE LEGAL","TESTIGO"] },
    { key:"subtipo_allanamiento", title:"SUBTIPO", type:"select", options:["ALLANAMIENTO DE MORADA","USURPACIÓN DE INMUEBLE","OCUPACIÓN TEMPORAL","OTRA"] },
    { key:"fhl", title:"FECHA, INTERVALO HORARIO Y LUGAR DEL HECHO", type:"fhl", horaHastaOpcional:true, interval:true, placeholderLugar:"Domicilio / local / nave / municipio" },
    { key:"inmueble_tipo", title:"TIPO DE INMUEBLE", type:"select", options:["VIVIENDA HABITUAL","SEGUNDA VIVIENDA","LOCAL","NAVE","SOLAR","OTRO"] },
    { key:"inmueble_tipo_otro", title:"ESPECIFIQUE OTRO TIPO DE INMUEBLE", type:"text", when:(st)=> (st.inmueble_tipo === "OTRO") },
    { key:"metodo_acceso", title:"MÉTODO DE ACCESO", type:"select", options:["ESCALO","FRACTURA CERRADURA","FORZAMIENTO PUERTA","FORZAMIENTO VENTANA","LLAVE FALSA / SUSTRAÍDA","OTRO"] },
    { key:"metodo_acceso_otro", title:"ESPECIFIQUE OTRO MÉTODO DE ACCESO", type:"text", when:(st)=> (st.metodo_acceso === "OTRO") },
    { key:"situacion_actual", title:"SITUACIÓN ACTUAL", type:"select", options:["SIGUEN DENTRO","YA NO ESTÁN","NO SABE"] },
    { key:"danos", title:"¿SE PRODUJERON DAÑOS?", type:"select", options:["NO","SI"] },
    { key:"descripcion_danos", title:"INDIQUE QUÉ DAÑOS SE PRODUJERON", type:"text", when:(st)=> (st.danos === "SI") },
    { key:"sustraccion", title:"¿SE PRODUJO SUSTRACCIÓN?", type:"select", options:["NO","SI"] },
    { key:"objetos", title:"OBJETOS SUSTRAÍDOS", type:"objects", when:(st)=> (st.sustraccion === "SI") },
    { key:"camaras", title:"¿HAY CÁMARAS DE SEGURIDAD?", type:"select", options:["NO","SI"] },
    { key:"autores", title:"DESCRIPCIÓN DEL AUTOR/ES", type:"authors" },
    { key:"resumen", title:"RESUMEN DE LOS HECHOS", type:"textarea", max:900 },
  ],

  // =============================
  // APROPIACIÓN INDEBIDA
  // =============================
  "APROPIACION_INDEBIDA": [
    { key:"calidad_denunciante", title:"DENUNCIA EN CALIDAD DE...", type:"select", options:["PERJUDICADO","REPRESENTANTE LEGAL","TESTIGO"] },
    { key:"subtipo_apropiacion", title:"SUBTIPO", type:"select", options:["OBJETO ENTREGADO Y NO DEVUELTO","DEPÓSITO / CUSTODIA","ALQUILER NO DEVUELTO","ERROR DE ENTREGA","OTRO"] },
    { key:"subtipo_apropiacion_otro", title:"ESPECIFIQUE OTRO SUBTIPO", type:"text", when:(st)=> (st.subtipo_apropiacion === "OTRO") },
    { key:"origen_tenencia", title:"ORIGEN DE LA TENENCIA", type:"select", options:["PRÉSTAMO","DEPÓSITO","ALQUILER","RELACIÓN LABORAL","ERROR DE ENTREGA","OTRO"] },
    { key:"origen_tenencia_otro", title:"ESPECIFIQUE OTRO ORIGEN DE LA TENENCIA", type:"text", when:(st)=> (st.origen_tenencia === "OTRO") },
    { key:"fhl", title:"FECHA, HORA Y LUGAR DEL HECHO", type:"fhl", horaHastaOpcional:true, placeholderLugar:"Calle / establecimiento / municipio" },
    { key:"objetos", title:"OBJETOS AFECTADOS", type:"objects" },
    { key:"requerimiento_devolucion", title:"¿REQUIRIÓ LA DEVOLUCIÓN?", type:"select", options:["SI","NO"] },
    { key:"fecha_requerimiento", title:"FECHA DEL REQUERIMIENTO", type:"date", when:(st)=> (st.requerimiento_devolucion === "SI") },
    { key:"medio_requerimiento", title:"MEDIO DEL REQUERIMIENTO", type:"select", options:["WHATSAPP","EMAIL","BUROFAX","LLAMADA","PRESENCIAL","OTRO"], when:(st)=> (st.requerimiento_devolucion === "SI") },
    { key:"respuesta_requerido", title:"RESPUESTA DEL REQUERIDO", type:"select", options:["SE NIEGA","NO CONTESTA","PROMETE DEVOLVER","OTRA"], when:(st)=> (st.requerimiento_devolucion === "SI") },
    { key:"importe_estimado_eur", title:"IMPORTE ESTIMADO (€)", type:"text", placeholder:"Ej.: 850" },
    { key:"autores", title:"DATOS / DESCRIPCIÓN DEL AUTOR", type:"authors" },
    { key:"resumen", title:"RESUMEN DE LOS HECHOS", type:"textarea", max:900 },
  ],

  // =============================
  // OTROS (mínimo global)
  // =============================
  "OTROS": [
    { key:"condicion", title:"DENUNCIA EN CALIDAD DE...", type:"select", options:["PERJUDICADO","TESTIGO"] },
    { key:"fhl", title:"FECHA, HORA Y LUGAR DEL HECHO", type:"fhl", horaHastaOpcional:true, placeholderLugar:"Calle / zona / municipio" },
    { key:"conoce_autor", title:"¿CONOCE AL AUTOR DE LOS HECHOS?", type:"select", options:["SI","NO"] },
    { key:"datos_autor", title:"AÑADA DATOS DEL AUTOR", type:"text",
      when:(st)=> (st.conoce_autor === "SI")
    },
    { key:"autores", title:"DESCRIPCIÓN DEL AUTOR/ES", type:"authors",
      when:(st)=> (st.conoce_autor === "NO")
    },
    { key:"lesiones", title:"¿PRESENTA LESIONES?", type:"select", options:["NO","SI"] },
    { key:"descripcion_lesiones", title:"DESCRIBA LAS LESIONES", type:"textarea", max:900,
      when:(st)=> (st.lesiones === "SI")
    },
    { key:"parte_medico", title:"¿APORTA INFORME/PARTE MÉDICO?", type:"select", options:["NO","SI"],
      when:(st)=> (st.lesiones === "SI")
    },
    { key:"danos", title:"¿SE PRODUJERON DAÑOS?", type:"select", options:["NO","SI"] },
    { key:"descripcion_danos", title:"DESCRIPCIÓN DE LOS DAÑOS", type:"text",
      when:(st)=> (st.danos === "SI")
    },
    { key:"sustraccion", title:"¿SE PRODUJO SUSTRACCIÓN DE OBJETOS?", type:"select", options:["NO","SI"] },
    { key:"objetos", title:"OBJETOS AFECTADOS/SUSTRAÍDOS", type:"objects",
      when:(st)=> (st.sustraccion === "SI")
    },
    { key:"camaras", title:"¿HAY CÁMARAS DE SEGURIDAD?", type:"select", options:["NO","SI"] },
    { key:"camaras_detalle", title:"GESTIÓN DE GRABACIONES", type:"text",
      when:(st)=> (st.camaras === "SI")
    },
    { key:"resumen", title:"RESUMEN DE LOS HECHOS", type:"textarea", max:900 },
  ]
};
export const EXPORT_KEY_MAP = QUESTION_SETS["EXPORT_KEY_MAP"] || {};
export { GLOBAL_ROUTES, QUESTION_SETS };
